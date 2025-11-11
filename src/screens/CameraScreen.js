import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"
import * as MediaLibrary from "expo-media-library"
import { useIsFocused } from "@react-navigation/native" //
import LoadingOverlay from "../components/LoadingOverlay"
import { processImage, downloadProcessedImage } from "../services/api"
import { saveToHistory } from "../services/storage"

// import * as FileSystem from 'expo-file-system/legacy' 

export default function CameraScreen() {
	const isFocused = useIsFocused() // <-- Hook de cycle de vie de React Navigation
	const [permission, requestPermission] = useCameraPermissions()
	const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions()
	const [facing, setFacing] = useState("back")
	const [capturedPhoto, setCapturedPhoto] = useState(null)
	const [processedPhoto, setProcessedPhoto] = useState(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const cameraRef = useRef(null)

	useEffect(() => {
	// Demander les permissions au montage
	if (!permission?.granted) {
		requestPermission()
	}
	if (!mediaPermission?.granted) {
		requestMediaPermission()
	}
	}, [])

	const toggleCameraFacing = () => {
		setFacing((current) => (current === "back" ? "front" : "back"))
	}

	const takePicture = async () => {
		if (!cameraRef.current) return

		try {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.8,
				base64: false,
			})

			setCapturedPhoto(photo.uri)
			setProcessedPhoto(null)
		} catch (error) {
			console.error("Erreur lors de la capture:", error)
			Alert.alert("Erreur", "Impossible de prendre la photo") 
		}
	}

	const handleProcessPhoto = async () => {
		if (!capturedPhoto) return

		setIsProcessing(true)
		try {
			const result = await processImage(capturedPhoto, "enhance")

			if (result && result.success && result.processedUrl) {
				// Télécharger l'image traitée localement
				const localUri = await downloadProcessedImage(result.processedUrl)
				setProcessedPhoto(localUri)

				Alert.alert("Succès", `Image traitée en ${result.processingTime}s`, [{ text: "OK" }])
			} else {
				throw new Error("Le traitement a échoué ou n'a pas retourné d'URL valide.")
			}
		} catch (error) {
			console.error("Erreur de traitement:", error)
			Alert.alert("Erreur", error.message || "Impossible de traiter l'image")
		} finally {
			setIsProcessing(false)
		}
	}

	const saveToGallery = async () => {
		if (!processedPhoto) return

		if (!mediaPermission?.granted) {
			const { status } = await requestMediaPermission()
			if (status !== "granted") {
				Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour sauvegarder l'image")
				return
			}
		}

		setIsSaving(true)
		try {
			// Sauvegarder dans la galerie
			await MediaLibrary.createAssetAsync(processedPhoto)

			// Sauvegarder dans l'historique
			await saveToHistory({
				type: "image",
				originalUri: capturedPhoto,
				processedUri: processedPhoto,
				source: "camera",
			})

			Alert.alert("Sauvegardé", "L'image a été enregistrée dans votre galerie", [
				{
				text: "OK",
				onPress: () => {
					// Réinitialiser pour une nouvelle capture
					setCapturedPhoto(null)
					setProcessedPhoto(null)
				},
				},
			])
		} catch (error) {
			console.error("Erreur de sauvegarde:", error)
			Alert.alert("Erreur", "Impossible de sauvegarder l'image")
		} finally {
			setIsSaving(false)
		}
	}

	const retakePhoto = () => {
		setCapturedPhoto(null)
		setProcessedPhoto(null)
	}

	// ----------------------------------------------------
	// --- RENDUS CONDITIONNELS ---
	// ----------------------------------------------------

	// 1. Vérification des permissions
	if (!permission || !mediaPermission) {
		return (
		<View style={styles.container}>
			<Text style={styles.message}>Chargement des permissions...</Text>
		</View>
		)
	}

	if (!permission.granted) {
		return (
		<View style={styles.container}>
			<Text style={styles.message}>L'accès à la caméra est nécessaire pour cette fonctionnalité</Text>
			<TouchableOpacity style={styles.button} onPress={requestPermission}>
			<Text style={styles.buttonText}>Autoriser la caméra</Text>
			</TouchableOpacity>
		</View>
		)
	}

	// 2. Mode prévisualisation après capture
	if (capturedPhoto) {
		return (
		<View style={styles.container}>
			<LoadingOverlay visible={isProcessing} message="Traitement de l'image..." />
			<LoadingOverlay visible={isSaving} message="Sauvegarde en cours..." />

			<ScrollView contentContainerStyle={styles.previewContainer}>
			<Text style={styles.title}>Photo capturée</Text>

			<View style={styles.imageContainer}>
				<Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
				<Text style={styles.imageLabel}>Original</Text>
			</View>

			{processedPhoto && (
				<View style={styles.imageContainer}>
				<Image source={{ uri: processedPhoto }} style={styles.previewImage} />
				<Text style={styles.imageLabel}>Amélioré</Text>
				</View>
			)}

			<View style={styles.buttonRow}>
				<TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={retakePhoto}>
				<Ionicons name="camera-outline" size={24} color="#6366f1" />
				<Text style={styles.secondaryButtonText}>Reprendre</Text>
				</TouchableOpacity>

				{!processedPhoto ? (
				<TouchableOpacity
					style={[styles.actionButton, styles.primaryButton]}
					onPress={handleProcessPhoto}
					disabled={isProcessing}
				>
					<Ionicons name="color-wand-outline" size={24} color="white" />
					<Text style={styles.primaryButtonText}>Traiter</Text>
				</TouchableOpacity>
				) : (
				<TouchableOpacity
					style={[styles.actionButton, styles.primaryButton]}
					onPress={saveToGallery}
					disabled={isSaving}
				>
					<Ionicons name="save-outline" size={24} color="white" />
					<Text style={styles.primaryButtonText}>Sauvegarder</Text>
				</TouchableOpacity>
				)}
			</View>
			</ScrollView>
		</View>
		)
	}

	// 3. Mode caméra
	return (
		<View style={styles.container}>
		{/* Le CameraView est conditionnel à isFocused pour forcer la réinitialisation 
			lorsque l'écran est mis au point (on le démonte et le remonte à chaque navigation)
		*/}
		{isFocused && (
			<CameraView 
			style={styles.camera} 
			facing={facing} 
			ref={cameraRef}
			/>
		)}

		{/* Les contrôles sont sortis du CameraView (et utilisent la position absolue 
			définie dans styles.cameraControls) pour éviter l'avertissement
		*/}
		<View style={styles.cameraControls}> 
			<TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
			<Ionicons name="camera-reverse-outline" size={32} color="white" />
			</TouchableOpacity>

			<TouchableOpacity style={styles.captureButton} onPress={takePicture}>
			<View style={styles.captureButtonInner} />
			</TouchableOpacity>

			{/* Espace vide pour centrer le bouton de capture */}
			<View style={styles.controlButton} /> 
		</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
	},
	camera: {
		// La caméra occupe tout l'espace disponible
		...StyleSheet.absoluteFillObject, 
	},
	cameraControls: {
		// Les contrôles sont positionnés en absolu au-dessus de la caméra
		position: "absolute", 
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "flex-end",
		paddingBottom: 40,
		paddingHorizontal: 20,
		backgroundColor: "transparent",
	},
	controlButton: {
		width: 60,
		height: 60,
		justifyContent: "center",
		alignItems: "center",
	},
	captureButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 4,
		borderColor: "white",
	},
	captureButtonInner: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: "white",
	},
	previewContainer: {
		padding: 20,
		alignItems: "center",
		// Ajout d'un paddingBottom pour que le dernier bouton ne soit pas coupé
		paddingBottom: 100, 
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "white",
		marginBottom: 20,
	},
	imageContainer: {
		width: "100%",
		marginBottom: 20,
	},
	previewImage: {
		width: "100%",
		height: 300,
		borderRadius: 12,
		backgroundColor: "#333",
	},
	imageLabel: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
		marginTop: 8,
		textAlign: "center",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 15,
		marginTop: 20,
		width: "100%",
	},
	actionButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 16,
		borderRadius: 12,
	},
	primaryButton: {
		backgroundColor: "#6366f1",
	},
	secondaryButton: {
		backgroundColor: "white",
		borderWidth: 2,
		borderColor: "#6366f1",
	},
	primaryButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	secondaryButtonText: {
		color: "#6366f1",
		fontSize: 16,
		fontWeight: "600",
	},
	message: {
		fontSize: 16,
		color: "white",
		textAlign: "center",
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	button: {
		backgroundColor: "#6366f1",
		paddingHorizontal: 30,
		paddingVertical: 15,
		borderRadius: 12,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
})

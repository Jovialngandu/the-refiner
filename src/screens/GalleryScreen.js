"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as MediaLibrary from "expo-media-library"
import { Ionicons } from "@expo/vector-icons"
import { Video } from "expo-av"

import LoadingOverlay from "../components/LoadingOverlay"
import { uploadFile, downloadProcessedImage } from "../services/api"
import { saveToHistory } from "../services/storage"

export default function GalleryScreen() {
	const [permission, requestPermission] = MediaLibrary.usePermissions()
	const [selectedMedia, setSelectedMedia] = useState(null)
	const [processedMedia, setProcessedMedia] = useState(null)
	const [mediaType, setMediaType] = useState(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const pickImage = async () => {
		// Demander la permission si nécessaire
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (status !== "granted") {
			Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour sélectionner des fichiers")
			return
		}

		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: false,
				quality: 0.8,
			})

			if (!result.canceled && result.assets[0]) {
				setSelectedMedia(result.assets[0].uri)
				setMediaType("image")
				setProcessedMedia(null)
			}
		} catch (error) {
			console.error("Erreur lors de la sélection:", error)
			Alert.alert("Erreur", "Impossible de sélectionner l'image")
		}
	}

	const pickVideo = async () => {
	const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
	if (status !== "granted") {
		Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour sélectionner des fichiers")
		return
	}

	try {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["videos"],
			allowsEditing: false,
			quality: 0.8,
		})

		if (!result.canceled && result.assets[0]) {
			setSelectedMedia(result.assets[0].uri)
			setMediaType("video")
			setProcessedMedia(null)
		}
	} catch (error) {
		console.error("Erreur lors de la sélection:", error)
		Alert.alert("Erreur", "Impossible de sélectionner la vidéo")
	}
	}

	const processMedia = async () => {
		if (!selectedMedia || !mediaType) return

		setIsProcessing(true)
		try {
			const result = await uploadFile(selectedMedia, mediaType)

			if (result.success) {
				// Télécharger le média traité localement
				const localUri = await downloadProcessedImage(result.processedUrl)
				setProcessedMedia(localUri)

				Alert.alert("Succès", `${mediaType === "video" ? "Vidéo" : "Image"} traitée en ${result.processingTime}s`, [
					{ text: "OK" },
				])
			} else {
				throw new Error("Le traitement a échoué")
			}
		} catch (error) {
			console.error("Erreur de traitement:", error)
			Alert.alert("Erreur", error.message || "Impossible de traiter le fichier")
		} finally {
			setIsProcessing(false)
		}
	}

	const saveToGallery = async () => {
		if (!processedMedia) return

		if (!permission?.granted) {
			const { status } = await requestPermission()
			if (status !== "granted") {
				Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour sauvegarder")
				return
			}
		}

	setIsSaving(true)
	try {
		// Sauvegarder dans la galerie
		await MediaLibrary.createAssetAsync(processedMedia)

		// Sauvegarder dans l'historique
		await saveToHistory({
			type: mediaType,
			originalUri: selectedMedia,
			processedUri: processedMedia,
			source: "gallery",
		})

		Alert.alert(
			"Sauvegardé",
			`Le ${mediaType === "video" ? "vidéo" : "fichier"} a été enregistré dans votre galerie`,
			[
				{
					text: "OK",
					onPress: () => {
						setSelectedMedia(null)
						setProcessedMedia(null)
						setMediaType(null)
					},
				},
			],
		)
	} catch (error) {
		console.error("Erreur de sauvegarde:", error)
		Alert.alert("Erreur", "Impossible de sauvegarder le fichier")
	} finally {
		setIsSaving(false)
	}
	}

	const resetSelection = () => {
		setSelectedMedia(null)
		setProcessedMedia(null)
		setMediaType(null)
	}

	// Mode prévisualisation après sélection
	if (selectedMedia) {
	return (
		<View style={styles.container}>
		<LoadingOverlay visible={isProcessing} message="Traitement du fichier..." />
		<LoadingOverlay visible={isSaving} message="Sauvegarde en cours..." />

		<ScrollView contentContainerStyle={styles.previewContainer}>
			<Text style={styles.title}>{mediaType === "video" ? "Vidéo sélectionnée" : "Image sélectionnée"}</Text>

			<View style={styles.mediaContainer}>
			{mediaType === "image" ? (
				<Image source={{ uri: selectedMedia }} style={styles.previewImage} />
			) : (
				<Video
					source={{ uri: selectedMedia }}
					style={styles.previewImage}
					useNativeControls
					resizeMode="contain"
					isLooping
				/>
			)}
			<Text style={styles.mediaLabel}>Original</Text>
			</View>

			{processedMedia && (
			<View style={styles.mediaContainer}>
				{mediaType === "image" ? (
				<Image source={{ uri: processedMedia }} style={styles.previewImage} />
				) : (
				<Video
					source={{ uri: processedMedia }}
					style={styles.previewImage}
					useNativeControls
					resizeMode="contain"
					isLooping
				/>
				)}
				<Text style={styles.mediaLabel}>Amélioré</Text>
			</View>
			)}

			<View style={styles.buttonRow}>
			<TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={resetSelection}>
				<Ionicons name="arrow-back-outline" size={24} color="#6366f1" />
				<Text style={styles.secondaryButtonText}>Retour</Text>
			</TouchableOpacity>

			{!processedMedia ? (
				<TouchableOpacity
					style={[styles.actionButton, styles.primaryButton]}
					onPress={processMedia}
					disabled={isProcessing}
				>
				<Ionicons name="cloud-upload-outline" size={24} color="white" />
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

	// Mode sélection
	return (
	<View style={styles.container}>
		<View style={styles.selectionContainer}>
		<Text style={styles.title}>Sélectionner un fichier</Text>
		<Text style={styles.subtitle}>Choisissez une image ou une vidéo de votre galerie pour l'améliorer</Text>

		<View style={styles.optionsContainer}>
			<TouchableOpacity style={styles.optionCard} onPress={pickImage}>
			<View style={styles.iconContainer}>
				<Ionicons name="image-outline" size={64} color="#6366f1" />
			</View>
			<Text style={styles.optionTitle}>Image</Text>
			<Text style={styles.optionDescription}>Sélectionner une photo de votre galerie</Text>
			</TouchableOpacity>

			<TouchableOpacity style={styles.optionCard} onPress={pickVideo}>
			<View style={styles.iconContainer}>
				<Ionicons name="videocam-outline" size={64} color="#6366f1" />
			</View>
			<Text style={styles.optionTitle}>Vidéo</Text>
			<Text style={styles.optionDescription}>Sélectionner une vidéo de votre galerie</Text>
			</TouchableOpacity>
		</View>

		<View style={styles.infoBox}>
			<Ionicons name="information-circle-outline" size={24} color="#6366f1" />
			<Text style={styles.infoText}>Les fichiers seront traités via notre API pour améliorer leur qualité</Text>
		</View>
		</View>
	</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	selectionContainer: {
		flex: 1,
		padding: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#1f2937",
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#6b7280",
		textAlign: "center",
		marginBottom: 30,
	},
	optionsContainer: {
		gap: 20,
		marginBottom: 30,
	},
	optionCard: {
		backgroundColor: "white",
		borderRadius: 16,
		padding: 30,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	iconContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "#eef2ff",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	optionTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#1f2937",
		marginBottom: 8,
	},
	optionDescription: {
		fontSize: 14,
		color: "#6b7280",
		textAlign: "center",
	},
	infoBox: {
		flexDirection: "row",
		backgroundColor: "#eef2ff",
		padding: 16,
		borderRadius: 12,
		gap: 12,
		alignItems: "center",
	},
	infoText: {
		flex: 1,
		fontSize: 14,
		color: "#4b5563",
		lineHeight: 20,
	},
	previewContainer: {
		padding: 20,
		alignItems: "center",
	},
	mediaContainer: {
		width: "100%",
		marginBottom: 20,
	},
	previewImage: {
		width: "100%",
		height: 300,
		borderRadius: 12,
		backgroundColor: "#e5e7eb",
	},
	mediaLabel: {
		color: "#1f2937",
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
})

import { Alert, Linking } from "react-native"
import * as MediaLibrary from "expo-media-library"
import { Camera } from "expo-camera"

/**
 * Vérifie et demande les permissions de la caméra
 */
export const requestCameraPermission = async () => {
	try {
		const { status } = await Camera.requestCameraPermissionsAsync()

		if (status !== "granted") {
			Alert.alert(
			"Permission refusée",
			"L'accès à la caméra est nécessaire pour capturer des photos et vidéos. Vous pouvez activer cette permission dans les paramètres de votre appareil.",
			[
				{ text: "Annuler", style: "cancel" },
				{ text: "Ouvrir les paramètres", onPress: () => Linking.openSettings() },
			],
			)
			return false
		}

		return true
  } catch (error) {
   		console.error("Erreur lors de la demande de permission caméra:", error)
   		return false
  }
}

/**
 * Vérifie et demande les permissions de la galerie
 */
export const requestMediaLibraryPermission = async () => {
	try {
		const { status } = await MediaLibrary.requestPermissionsAsync()

		if (status !== "granted") {
			Alert.alert(
				"Permission refusée",
				"L'accès à la galerie est nécessaire pour sélectionner et sauvegarder des médias. Vous pouvez activer cette permission dans les paramètres de votre appareil.",
				[
					{ text: "Annuler", style: "cancel" },
					{ text: "Ouvrir les paramètres", onPress: () => Linking.openSettings() },
				],
			)
			return false
		}

		return true
	} catch (error) {
		console.error("Erreur lors de la demande de permission galerie:", error)
		return false
	}
}

/**
 * Vérifie toutes les permissions nécessaires au démarrage
 */
export const checkAllPermissions = async () => {
	const cameraStatus = await Camera.getCameraPermissionsAsync()
	const mediaStatus = await MediaLibrary.getPermissionsAsync()

	return {
		camera: cameraStatus.granted,
		mediaLibrary: mediaStatus.granted,
	}
}

/**
 * Affiche un message d'erreur personnalisé selon le type d'erreur
 */
export const handlePermissionError = (permissionType) => {
	const messages = {
		camera: {
			title: "Caméra non disponible",
			message: "Veuillez autoriser l'accès à la caméra dans les paramètres de votre appareil.",
		},
		mediaLibrary: {
			title: "Galerie non disponible",
			message: "Veuillez autoriser l'accès à la galerie dans les paramètres de votre appareil.",
		},
	}

	const config = messages[permissionType] || {
		title: "Permission requise",
		message: "Cette fonctionnalité nécessite des permissions supplémentaires.",
	}

	Alert.alert(config.title, config.message, [
		{ text: "Annuler", style: "cancel" },
		{ text: "Ouvrir les paramètres", onPress: () => Linking.openSettings() },
	])
}

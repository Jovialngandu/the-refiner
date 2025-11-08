import axios from "axios"
import * as FileSystem from 'expo-file-system/legacy'
// Configuration de l'API
const API_BASE_URL = "https://api.example.com" // À remplacer par votre URL d'API réelle

// Pour le développement, vous pouvez utiliser une API simulée


const USE_MOCK_API = true

/**
 * Simule un délai de traitement API
 */
const mockDelay = (ms = 2000) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Simule une réponse API avec une image améliorée
 */
const mockProcessImage = async () => {
  await mockDelay(2000)
  // Retourne une URL d'image de démonstration
  return {
	success: true,
	processedUrl: "https://picsum.photos/800/600?random=" + Date.now(),
	processingTime: 2.1,
	enhancement: "brightness_contrast",
  }
}

/**
 * Traite une image via l'API
 * @param {string} imageUri - URI locale de l'image
 * @param {string} filterType - Type de filtre à appliquer
 */
export const processImage = async (imageUri, filterType = "enhance") => {
	try {
		if (USE_MOCK_API) {
			return await mockProcessImage()
		}

		// Préparer le fichier pour l'upload
		const formData = new FormData()
		formData.append("image", {
			uri: imageUri,
			type: "image/jpeg",
			name: "photo.jpg",
		})
		formData.append("filter", filterType)

		const response = await axios.post(`${API_BASE_URL}/api/process/image`, formData, {
			headers: {
			"Content-Type": "multipart/form-data",
			},
			timeout: 30000, // 30 secondes
		})

		return response.data
	} catch (error) {
		console.error("Erreur lors du traitement de l'image:", error)
		throw new Error(error.response?.data?.message || "Échec du traitement de l'image")
	}
}

/**
 * Upload et traite un fichier (image ou vidéo)
 * @param {string} fileUri - URI locale du fichier
 * @param {string} fileType - Type de fichier (image/video)
 */
export const uploadFile = async (fileUri, fileType = "image") => {
	try {
		if (USE_MOCK_API) {
			await mockDelay(3000)
			return {
			success: true,
			processedUrl:
				fileType === "video"
				? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
				: "https://picsum.photos/800/600?random=" + Date.now(),
			processingTime: 3.2,
			fileType: fileType,
			}
		}

		const formData = new FormData()
		formData.append("file", {
			uri: fileUri,
			type: fileType === "video" ? "video/mp4" : "image/jpeg",
			name: fileType === "video" ? "video.mp4" : "image.jpg",
		})

		const response = await axios.post(`${API_BASE_URL}/api/upload/file`, formData, {
			headers: {
			"Content-Type": "multipart/form-data",
			},
			timeout: 60000, // 60 secondes pour les vidéos
		})

		return response.data
	} catch (error) {
		console.error("Erreur lors de l'upload du fichier:", error)
		throw new Error(error.response?.data?.message || "Échec de l'upload du fichier")
	}
}

/**
 * Télécharge une image traitée depuis l'URL
 * @param {string} url - URL de l'image traitée
 */
export const downloadProcessedImage = async (url) => {
	try {
		const filename = `refined_${Date.now()}.jpg`
		const fileUri = FileSystem.documentDirectory + filename

		const downloadResult = await FileSystem.downloadAsync(url, fileUri)

		return downloadResult.uri
	} catch (error) {
		console.error("Erreur lors du téléchargement:", error)
		throw new Error("Échec du téléchargement de l'image traitée")
	}
}

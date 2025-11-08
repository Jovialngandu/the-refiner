import AsyncStorage from "@react-native-async-storage/async-storage"

const HISTORY_KEY = "@the_refiner_history"

/**
 * Sauvegarde un résultat dans l'historique
 */
export const saveToHistory = async (item) => {
	try {
		const history = await getHistory()
		const newItem = {
			id: Date.now().toString(),
			timestamp: new Date().toISOString(),
			...item,
		}

		const updatedHistory = [newItem, ...history]
		await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))

		return newItem
	} catch (error) {
		console.error("Erreur lors de la sauvegarde dans l'historique:", error)
		throw error
	}
}

/**
 * Récupère l'historique complet
 */
export const getHistory = async () => {
	try {
		const historyJson = await AsyncStorage.getItem(HISTORY_KEY)
		return historyJson ? JSON.parse(historyJson) : []
	} catch (error) {
		console.error("Erreur lors de la récupération de l'historique:", error)
		return []
	}
}

/**
 * Supprime un élément de l'historique
 */
export const deleteFromHistory = async (id) => {
	try {
		const history = await getHistory()
		const updatedHistory = history.filter((item) => item.id !== id)
	await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
	} catch (error) {
		console.error("Erreur lors de la suppression de l'historique:", error)
		throw error
	}
}

/**
 * Efface tout l'historique
 */
export const clearHistory = async () => {
	try {
		await AsyncStorage.removeItem(HISTORY_KEY)
	} catch (error) {
		console.error("Erreur lors de l'effacement de l'historique:", error)
		throw error
	}
}

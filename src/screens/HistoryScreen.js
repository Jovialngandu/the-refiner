"use client"

import { useState, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

import { getHistory, deleteFromHistory, clearHistory } from "../services/storage"

export default function HistoryScreen() {
	const [history, setHistory] = useState([])
	const [refreshing, setRefreshing] = useState(false)
	const [selectedItem, setSelectedItem] = useState(null)

	const loadHistory = async () => {
		try {
			const data = await getHistory()
			setHistory(data)
		} catch (error) {
			console.error("Erreur lors du chargement de l'historique:", error)
			Alert.alert("Erreur", "Impossible de charger l'historique")
		}
	}

	// Recharger l'historique quand l'écran est focus
	useFocusEffect(
		useCallback(() => {
			loadHistory()
		}, []),
	)

	const onRefresh = async () => {
		setRefreshing(true)
		await loadHistory()
		setRefreshing(false)
	}

	const handleDeleteItem = (id) => {
		Alert.alert("Supprimer", "Voulez-vous supprimer cet élément de l'historique ?", [
			{ text: "Annuler", style: "cancel" },
			{
				text: "Supprimer",
				style: "destructive",
				onPress: async () => {
					try {
						await deleteFromHistory(id)
						await loadHistory()
					} catch (error) {
						Alert.alert("Erreur", "Impossible de supprimer l'élément")
					}
				},
			},
		])
	}

	const handleClearAll = () => {
		if (history.length === 0) return

		Alert.alert("Effacer tout", "Voulez-vous effacer tout l'historique ? Cette action est irréversible.", [
			{ text: "Annuler", style: "cancel" },
			{
				text: "Effacer",
				style: "destructive",
				onPress: async () => {
					try {
					await clearHistory()
					await loadHistory()
					} catch (error) {
					Alert.alert("Erreur", "Impossible d'effacer l'historique")
					}
				},
			},
		])
	}

	const handleViewItem = (item) => {
		setSelectedItem(item)
	}

	const closeDetailView = () => {
		setSelectedItem(null)
	}

	const formatDate = (isoString) => {
		const date = new Date(isoString)
		return date.toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		})
	}

	const renderHistoryItem = ({ item }) => (
	<TouchableOpacity style={styles.historyCard} onPress={() => handleViewItem(item)}>
		<Image source={{ uri: item.processedUri }} style={styles.thumbnail} resizeMode="cover" />
		<View style={styles.cardContent}>
		<View style={styles.cardHeader}>
			<View style={styles.typeContainer}>
			<Ionicons name={item.type === "video" ? "videocam" : "image"} size={16} color="#6366f1" />
			<Text style={styles.typeText}>{item.type === "video" ? "Vidéo" : "Image"}</Text>
			</View>
			<View style={styles.sourceContainer}>
			<Ionicons name={item.source === "camera" ? "camera" : "images"} size={14} color="#9ca3af" />
			<Text style={styles.sourceText}>{item.source === "camera" ? "Caméra" : "Galerie"}</Text>
			</View>
		</View>
		<Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
		</View>
		<TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id)}>
		<Ionicons name="trash-outline" size={20} color="#ef4444" />
		</TouchableOpacity>
	</TouchableOpacity>
	)

	// Vue détaillée d'un élément
	if (selectedItem) {
		return (
			<View style={styles.detailContainer}>
			<View style={styles.detailHeader}>
				<TouchableOpacity onPress={closeDetailView}>
				<Ionicons name="arrow-back" size={28} color="#1f2937" />
				</TouchableOpacity>
				<Text style={styles.detailTitle}>Détails</Text>
				<View style={{ width: 28 }} />
			</View>

			<FlatList
				data={[
				{ key: "original", uri: selectedItem.originalUri, label: "Original" },
				{ key: "processed", uri: selectedItem.processedUri, label: "Amélioré" },
				]}
				renderItem={({ item }) => (
				<View style={styles.detailImageContainer}>
					<Text style={styles.detailImageLabel}>{item.label}</Text>
					<Image source={{ uri: item.uri }} style={styles.detailImage} resizeMode="contain" />
				</View>
				)}
				contentContainerStyle={styles.detailContent}
			/>

			<View style={styles.detailInfo}>
				<View style={styles.infoRow}>
				<Ionicons name="calendar-outline" size={20} color="#6b7280" />
				<Text style={styles.infoText}>{formatDate(selectedItem.timestamp)}</Text>
				</View>
				<View style={styles.infoRow}>
				<Ionicons
					name={selectedItem.source === "camera" ? "camera-outline" : "images-outline"}
					size={20}
					color="#6b7280"
				/>
				<Text style={styles.infoText}>Source: {selectedItem.source === "camera" ? "Caméra" : "Galerie"}</Text>
				</View>
				<View style={styles.infoRow}>
				<Ionicons
					name={selectedItem.type === "video" ? "videocam-outline" : "image-outline"}
					size={20}
					color="#6b7280"
				/>
				<Text style={styles.infoText}>Type: {selectedItem.type === "video" ? "Vidéo" : "Image"}</Text>
				</View>
			</View>
			</View>
		)
	}

	// Liste de l'historique
	return (
		<View style={styles.container}>
			{history.length > 0 && (
			<View style={styles.headerActions}>
				<Text style={styles.countText}>{history.length} élément(s)</Text>
				<TouchableOpacity onPress={handleClearAll}>
				<Text style={styles.clearButton}>Effacer tout</Text>
				</TouchableOpacity>
			</View>
			)}

			{history.length === 0 ? (
			<View style={styles.emptyContainer}>
				<Ionicons name="time-outline" size={80} color="#d1d5db" />
				<Text style={styles.emptyTitle}>Aucun historique</Text>
				<Text style={styles.emptyText}>Les médias que vous traitez apparaîtront ici</Text>
			</View>
			) : (
			<FlatList
				data={history}
				renderItem={renderHistoryItem}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
			/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	headerActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 12,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	countText: {
		fontSize: 14,
		color: "#6b7280",
		fontWeight: "500",
	},
	clearButton: {
		fontSize: 14,
		color: "#ef4444",
		fontWeight: "600",
	},
	listContent: {
		padding: 16,
		gap: 12,
	},
	historyCard: {
		flexDirection: "row",
		backgroundColor: "white",
		borderRadius: 12,
		padding: 12,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	thumbnail: {
		width: 80,
		height: 80,
		borderRadius: 8,
		backgroundColor: "#e5e7eb",
	},
	cardContent: {
		flex: 1,
		marginLeft: 12,
		gap: 6,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	typeContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#eef2ff",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 6,
	},
	typeText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#6366f1",
	},
	sourceContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	sourceText: {
		fontSize: 12,
		color: "#9ca3af",
	},
	dateText: {
		fontSize: 13,
		color: "#6b7280",
	},
	deleteButton: {
		padding: 8,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 40,
	},
	emptyTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#1f2937",
		marginTop: 16,
		marginBottom: 8,
	},
	emptyText: {
		fontSize: 15,
		color: "#6b7280",
		textAlign: "center",
		lineHeight: 22,
	},
	detailContainer: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	detailHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	detailTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1f2937",
	},
	detailContent: {
		padding: 20,
		gap: 24,
	},
	detailImageContainer: {
		backgroundColor: "white",
		borderRadius: 12,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	detailImageLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1f2937",
		marginBottom: 12,
	},
	detailImage: {
		width: "100%",
		height: 300,
		borderRadius: 8,
		backgroundColor: "#e5e7eb",
	},
	detailInfo: {
		backgroundColor: "white",
		padding: 20,
		gap: 16,
		borderTopWidth: 1,
		borderTopColor: "#e5e7eb",
	},
	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	infoText: {
		fontSize: 15,
		color: "#4b5563",
	},
})

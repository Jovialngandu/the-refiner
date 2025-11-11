"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { checkAllPermissions, requestCameraPermission, requestMediaLibraryPermission } from "../utils/permissions"

/**
 * Composant qui vérifie les permissions avant d'afficher le contenu
 */
export default function PermissionGuard({ children, requiredPermissions = [] }) {
	const [permissions, setPermissions] = useState(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		checkPermissions()
	}, [])

	const checkPermissions = async () => {
		setIsLoading(true)
		const perms = await checkAllPermissions()
		setPermissions(perms)
		setIsLoading(false)
	}

	const handleRequestPermission = async (type) => {
		if (type === "camera") {
			await requestCameraPermission()
		} else if (type === "mediaLibrary") {
			await requestMediaLibraryPermission()
		}
		await checkPermissions()
		}

		if (isLoading) {
			return (
				<View style={styles.container}>
				<ActivityIndicator size="large" color="#6366f1" />
				<Text style={styles.loadingText}>Vérification des permissions...</Text>
				</View>
			)
	}

	// Vérifier si toutes les permissions requises sont accordées
	const missingPermissions = requiredPermissions.filter((perm) => !permissions[perm])

	if (missingPermissions.length > 0) {
	return (
		<View style={styles.container}>
		<Ionicons name="lock-closed-outline" size={80} color="#6366f1" />
		<Text style={styles.title}>Permissions requises</Text>
		<Text style={styles.message}>Cette fonctionnalité nécessite les permissions suivantes :</Text>

		<View style={styles.permissionsList}>
			{missingPermissions.map((perm) => (
			<View key={perm} style={styles.permissionItem}>
				<Ionicons name={perm === "camera" ? "camera-outline" : "images-outline"} size={24} color="#6366f1" />
				<Text style={styles.permissionText}>{perm === "camera" ? "Caméra" : "Galerie photo"}</Text>
				<TouchableOpacity style={styles.grantButton} onPress={() => handleRequestPermission(perm)}>
				<Text style={styles.grantButtonText}>Autoriser</Text>
				</TouchableOpacity>
			</View>
			))}
		</View>
		</View>
	)
	}

	return children
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#f5f5f5",
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: "#6b7280",
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#1f2937",
		marginTop: 20,
		marginBottom: 12,
	},
	message: {
		fontSize: 16,
		color: "#6b7280",
		textAlign: "center",
		marginBottom: 24,
	},
	permissionsList: {
		width: "100%",
		gap: 12,
	},
	permissionItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "white",
		padding: 16,
		borderRadius: 12,
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	permissionText: {
		flex: 1,
		fontSize: 16,
		fontWeight: "600",
		color: "#1f2937",
	},
	grantButton: {
		backgroundColor: "#6366f1",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	grantButtonText: {
		color: "white",
		fontSize: 14,
		fontWeight: "600",
	},
})

import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { __DEV__ } from "react-native"

	/**
	 * Composant Error Boundary pour capturer les erreurs React
	 */
export class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error }
	}

	componentDidCatch(error, errorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo)
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null })
	}

	render() {
		if (this.state.hasError) {
			return (
			<View style={styles.container}>
				<Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
				<Text style={styles.title}>Une erreur est survenue</Text>
				<Text style={styles.message}>L'application a rencontré un problème. Veuillez réessayer.</Text>
				{__DEV__ && this.state.error && <Text style={styles.errorText}>{this.state.error.toString()}</Text>}
				<TouchableOpacity style={styles.button} onPress={this.handleReset}>
				<Text style={styles.buttonText}>Réessayer</Text>
				</TouchableOpacity>
			</View>
			)
		}

		return this.props.children
	}
	}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#f5f5f5",
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
	errorText: {
		fontSize: 12,
		color: "#ef4444",
		textAlign: "center",
		marginBottom: 24,
		fontFamily: "monospace",
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

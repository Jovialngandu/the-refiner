import { View, ActivityIndicator, Text, StyleSheet, Modal } from "react-native"

export default function LoadingOverlay({ visible, message = "Traitement en cours..." }) {
	return (
		<Modal transparent={true} animationType="fade" visible={visible} onRequestClose={() => {}}>
			<View style={styles.overlay}>
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#6366f1" />
				<Text style={styles.message}>{message}</Text>
			</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		justifyContent: "center",
		alignItems: "center",
	},
	container: {
		backgroundColor: "white",
		padding: 30,
		borderRadius: 15,
		alignItems: "center",
		minWidth: 200,
	},
	message: {
		marginTop: 15,
		fontSize: 16,
		color: "#333",
		textAlign: "center",
	},
})

import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"

import CameraScreen from "./src/screens/CameraScreen"
import GalleryScreen from "./src/screens/GalleryScreen"
import HistoryScreen from "./src/screens/HistoryScreen"
//import RealtimeScreen from "./src/screens/RealtimeScreen"
import { ErrorBoundary } from "./src/components/ErrorBoundary"

const Tab = createBottomTabNavigator()

export default function App() {
return (
<ErrorBoundary>
	<NavigationContainer>
	<StatusBar style="auto" />
	<Tab.Navigator
		screenOptions={({ route }) => ({
		tabBarIcon: ({ focused, color, size }) => {
			let iconName

			if (route.name === "Camera") {
				iconName = focused ? "camera" : "camera-outline"
			} else if (route.name === "Gallery") {
				iconName = focused ? "images" : "images-outline"
			} else if (route.name === "History") {
				iconName = focused ? "time" : "time-outline"
			} else if (route.name === "Realtime") {
				iconName = focused ? "videocam" : "videocam-outline"
			}

			return <Ionicons name={iconName} size={size} color={color} />
		},
		tabBarActiveTintColor: "#6366f1",
		tabBarInactiveTintColor: "gray",
		headerStyle: {
			backgroundColor: "#6366f1",
		},
		headerTintColor: "#fff",
		headerTitleStyle: {
			fontWeight: "bold",
		},
		})}
	>
		<Tab.Screen name="Camera" component={CameraScreen} options={{ title: "Capture" }} />
		<Tab.Screen name="Gallery" component={GalleryScreen} options={{ title: "Upload" }} />
		{/* <Tab.Screen name="Realtime" component={RealtimeScreen} options={{ title: "Real-time" }} /> */}
		<Tab.Screen name="History" component={HistoryScreen} options={{ title: "Historique" }} />
	</Tab.Navigator>
	</NavigationContainer>
</ErrorBoundary>
)
}

"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"

import { processImage } from "../services/api"

export default function RealtimeScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState("back")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFrame, setProcessedFrame] = useState(null)
  const [fps, setFps] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  const cameraRef = useRef(null)
  const intervalRef = useRef(null)
  const fpsIntervalRef = useRef(null)

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission()
    }
  }, [])

  // Calculer le FPS
  useEffect(() => {
    if (isProcessing) {
      fpsIntervalRef.current = setInterval(() => {
        setFps(frameCount)
        setFrameCount(0)
      }, 1000)
    } else {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
      setFps(0)
      setFrameCount(0)
    }

    return () => {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
    }
  }, [isProcessing, frameCount])

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"))
  }

  const captureAndProcessFrame = async () => {
    if (!cameraRef.current) return

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Qualité réduite pour la vitesse
        base64: false,
        skipProcessing: true,
      })

      // Traiter la frame via l'API
      const result = await processImage(photo.uri, "realtime")

      if (result.success) {
        setProcessedFrame(result.processedUrl)
        setFrameCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Erreur lors du traitement de la frame:", error)
      // Ne pas afficher d'alerte pour ne pas interrompre le flux
    }
  }

  const startRealtimeProcessing = () => {
    if (isProcessing) return

    setIsProcessing(true)
    setProcessedFrame(null)

    // Capturer et traiter des frames toutes les 500ms (2 FPS)
    intervalRef.current = setInterval(() => {
      captureAndProcessFrame()
    }, 500)
  }

  const stopRealtimeProcessing = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsProcessing(false)
    setProcessedFrame(null)
  }

  useEffect(() => {
    // Nettoyer l'intervalle au démontage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
    }
  }, [])

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Chargement...</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.splitView}>
        {/* Vue caméra en direct */}
        <View style={styles.viewContainer}>
          <Text style={styles.viewLabel}>Caméra en direct</Text>
          <CameraView style={styles.cameraView} facing={facing} ref={cameraRef} />
        </View>

        {/* Vue traitée */}
        <View style={styles.viewContainer}>
          <Text style={styles.viewLabel}>Traitement en temps réel</Text>
          <View style={styles.processedView}>
            {processedFrame ? (
              <Image source={{ uri: processedFrame }} style={styles.processedImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderView}>
                <Ionicons name="color-wand-outline" size={48} color="#9ca3af" />
                <Text style={styles.placeholderText}>
                  {isProcessing ? "Traitement en cours..." : "Appuyez sur Démarrer"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Statistiques */}
      {isProcessing && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={20} color="#6366f1" />
            <Text style={styles.statText}>{fps} FPS</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="images-outline" size={20} color="#6366f1" />
            <Text style={styles.statText}>{frameCount} frames</Text>
          </View>
        </View>
      )}

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing} disabled={isProcessing}>
          <Ionicons name="camera-reverse-outline" size={28} color={isProcessing ? "#9ca3af" : "#1f2937"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainButton, isProcessing && styles.stopButton]}
          onPress={isProcessing ? stopRealtimeProcessing : startRealtimeProcessing}
        >
          <Ionicons name={isProcessing ? "stop" : "play"} size={32} color="white" />
          <Text style={styles.mainButtonText}>{isProcessing ? "Arrêter" : "Démarrer"}</Text>
        </TouchableOpacity>

        <View style={styles.controlButton} />
      </View>

      {/* Informations */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
        <Text style={styles.infoText}>
          Le traitement capture et traite 2-3 images par seconde pour simuler un flux vidéo en temps réel
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  splitView: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
    padding: 12,
  },
  viewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  cameraView: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  processedView: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  processedImage: {
    width: "100%",
    height: "100%",
  },
  placeholderView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  controlButton: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
    backgroundColor: "#f3f4f6",
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: "#6366f1",
  },
  stopButton: {
    backgroundColor: "#ef4444",
  },
  mainButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#eef2ff",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },
  message: {
    fontSize: 16,
    color: "#1f2937",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})

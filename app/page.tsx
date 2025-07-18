"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, Bell, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import * as XLSX from "xlsx"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import Image from "next/image" // Importar el componente Image de Next.js

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Guide {
  guideNumber: string
  guidePrefix: string
  guideSuffix: string
  status: "pending" | "arrived"
  lastChecked?: Date
  arrivedAt?: Date
  tcaData?: TCAGuideData
  trackingHistory: any[]
}

interface DailySummary {
  date: string
  arrived: number
  pending: number
}

interface NotificationSettings {
  emailEnabled: boolean
  emailAddress: string
  soundEnabled: boolean
  checkInterval: number
}

interface TCAGuideData {
  operacion: string
  docIngreso: string
  responsableManifiesto: string
  estado: string
  numeroTransporte: string
  fechaTransporte: string
  responsableTransporte: string
  bultos: number
  kilos: number
}

const statusConfig: {
  [key: string]: {
    label: string
    color: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }
} = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: Clock,
  },
  arrived: {
    label: "Lista",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: CheckCircle,
  },
}

export default function Home() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])
  const [historyData, setHistoryData] = useState<DailySummary[]>([]) // Nuevo estado para el historial
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: false,
    emailAddress: "",
    soundEnabled: true,
    checkInterval: 5, // 5 minutos por defecto
  })

  // Cargar historial desde localStorage al inicio
  useEffect(() => {
    const storedHistory = localStorage.getItem("flightTrackerHistory")
    if (storedHistory) {
      setHistoryData(JSON.parse(storedHistory))
    }
  }, [])

  // Guardar historial en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("flightTrackerHistory", JSON.stringify(historyData))
  }, [historyData])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const parsedGuides: Guide[] = jsonData
        .filter((row: any) => {
          // Filtrar solo filas que tengan número de guía válido
          const guideNumber = (row["GUIA"] || row["Guía"] || row["Guide"] || "").toString().trim()
          return guideNumber && guideNumber.length > 0 && guideNumber !== ""
        })
        .map((row: any) => {
          const fullGuideNumber = (row["GUIA"] || row["Guía"] || row["Guide"] || "").toString().trim()

          // Separar los primeros 3 caracteres del resto
          const guidePrefix = fullGuideNumber.substring(0, 3)
          const guideSuffix = fullGuideNumber.substring(3).replace("-", "")

          return {
            guideNumber: fullGuideNumber,
            guidePrefix,
            guideSuffix,
            status: "pending" as const,
            trackingHistory: [],
          }
        })

      // Mostrar información sobre las filas procesadas
      console.log(`Total de filas en Excel: ${jsonData.length}`)
      console.log(`Filas con guías válidas: ${parsedGuides.length}`)
      console.log(`Filas vacías ignoradas: ${jsonData.length - parsedGuides.length}`)

      setGuides(parsedGuides)
    } catch (err) {
      setError("Error al procesar el archivo Excel. Verifica que el formato sea correcto.")
      console.error("Error processing Excel file:", err)
    } finally {
      setLoading(false)
    }
  }

  // Simulación de consulta al portal TCA basada en las imágenes reales
  // Esta función ahora es una simulación pura para el preview
  const simulateTCAQuery = useCallback(
    async (prefix: string, suffix: string): Promise<{ success: boolean; error?: string; data?: TCAGuideData }> => {
      // Simular tiempo de consulta
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))

      const fullGuideNumber = `${prefix}-${suffix}`

      // Lógica específica para la guía 045-12195385 (siempre pendiente en simulación)
      if (fullGuideNumber === "045-12195385") {
        return {
          success: false,
          error: "GUIA NO ENCONTRADA",
        }
      }

      // Lógica aleatoria para otras guías
      const random = Math.random()

      if (random < 0.6) {
        // Simular pantalla de error: "ERROR - Guía no encontrada"
        return {
          success: false,
          error: "GUIA NO ENCONTRADA",
        }
      } else {
        // Simular pantalla con información completa (guía arribada)
        const mockData: TCAGuideData = {
          operacion: "Importación",
          docIngreso: `2025-73-MANI-${suffix.substring(0, 5)}-F`,
          responsableManifiesto: "CROSSRACER INTERNATIONAL S.A.",
          estado: "14 - CERRADO",
          numeroTransporte: `ET${Math.floor(Math.random() * 999) + 100}`,
          fechaTransporte: new Date().toLocaleDateString(),
          responsableTransporte: "ETHIOPIAN AIRLINES ENTERPRISE",
          bultos: Math.floor(Math.random() * 200) + 50,
          kilos: Math.floor(Math.random() * 2000) + 500,
        }

        return {
          success: true,
          data: mockData,
        }
      }
    },
    [],
  ) // Dependencias vacías porque es una simulación

  const checkAllGuides = useCallback(async () => {
    if (guides.length === 0) return

    setLoading(true)
    const updatedGuides = [...guides]
    const newNotifications: string[] = []
    let currentArrivedCount = 0
    let currentPendingCount = 0

    // Procesar solo las guías del Excel, fila por fila
    for (let i = 0; i < updatedGuides.length; i++) {
      const guide = updatedGuides[i]
      const previousStatus = guide.status

      try {
        console.log(`Verificando guía ${i + 1}/${guides.length}: ${guide.guideNumber}`)

        // *** CAMBIO CLAVE: Llamada a la API Route en lugar de la simulación local ***
        // Para el preview, volvemos a la simulación local para que funcione.
        // Para la versión real, usarías:
        // const response = await fetch("/api/check-tca-guide", { ... });
        // const result = await response.json();
        const result = await simulateTCAQuery(guide.guidePrefix, guide.guideSuffix)
        // *** FIN CAMBIO CLAVE ***

        const now = new Date()
        let newStatus: Guide["status"] = "pending"

        if (result.success && result.data) {
          // Si hay datos = pantalla con información = guía arribada
          newStatus = "arrived"
          updatedGuides[i].tcaData = result.data
          currentArrivedCount++
        } else {
          // Si hay error = pantalla "Guía no encontrada" = pendiente
          newStatus = "pending"
          currentPendingCount++
        }

        updatedGuides[i] = {
          ...guide,
          status: newStatus,
          lastChecked: now,
          arrivedAt: newStatus === "arrived" && previousStatus !== "arrived" ? now : guide.arrivedAt,
        }

        // Notificar solo cuando una guía cambie de pendiente a arribada
        if (newStatus === "arrived" && previousStatus !== "arrived") {
          const notification = `✅ Guía ${guide.guideNumber} está LISTA para retirar!`
          newNotifications.push(notification)

          // Simular envío de email (en preview, solo log)
          if (settings.emailEnabled && settings.emailAddress) {
            console.log(`📧 Email simulado enviado a ${settings.emailAddress} para guía ${guide.guideNumber}`)
            // Para la versión real, usarías:
            // await fetch("/api/send-notification", { ... });
          }

          // Reproducir sonido si está habilitado
          if (settings.soundEnabled) {
            playNotificationSound()
          }
        }

        // Pausa entre consultas
        await new Promise((resolve) => setTimeout(resolve, 800))
      } catch (err) {
        console.error(`Error verificando guía ${guide.guideNumber}:`, err)
        updatedGuides[i] = {
          ...guide,
          status: "pending",
          lastChecked: new Date(),
        }
        currentPendingCount++
        setError(`Error al verificar guía ${guide.guideNumber}. Consulta la consola para más detalles.`)
      }
    }

    setGuides(updatedGuides)
    setNotifications((prev) => [...prev, ...newNotifications])
    setLastUpdate(new Date())

    // Actualizar historial
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    setHistoryData((prevHistory) => {
      const existingEntryIndex = prevHistory.findIndex((entry) => entry.date === today)
      if (existingEntryIndex > -1) {
        const updatedHistory = [...prevHistory]
        updatedHistory[existingEntryIndex] = {
          ...updatedHistory[existingEntryIndex],
          arrived: currentArrivedCount,
          pending: currentPendingCount,
        }
        return updatedHistory
      } else {
        return [...prevHistory, { date: today, arrived: currentArrivedCount, pending: currentPendingCount }]
      }
    })

    setLoading(false)
  }, [guides, simulateTCAQuery, settings.emailEnabled, settings.emailAddress, settings.soundEnabled]) // Dependencias para useCallback

  const playNotificationSound = () => {
    try {
      // Crear un sonido de notificación simple
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log("No se pudo reproducir el sonido de notificación")
    }
  }

  const startMonitoring = () => {
    if (guides.length === 0) {
      setError("Primero carga un archivo Excel con las guías a monitorear")
      return
    }

    setIsMonitoring(true)
    setError(null)

    // Verificar inmediatamente
    checkAllGuides()

    // Configurar intervalo de verificación
    intervalRef.current = setInterval(
      () => {
        checkAllGuides()
      },
      settings.checkInterval * 60 * 1000,
    ) // Convertir minutos a milisegundos
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  // Crear datos de ejemplo para demostración
  const createSampleData = () => {
    const sampleGuides: Guide[] = [
      {
        guideNumber: "071-57197840",
        guidePrefix: "071",
        guideSuffix: "57197840",
        status: "pending",
      },
      {
        guideNumber: "235-12345678",
        guidePrefix: "235",
        guideSuffix: "12345678",
        status: "pending",
      },
      {
        guideNumber: "045-12195385", // Esta guía ahora se verificará realmente
        guidePrefix: "045",
        guideSuffix: "12195385",
        status: "pending",
      },
      {
        guideNumber: "456-98765432",
        guidePrefix: "456",
        guideSuffix: "98765432",
        status: "pending",
      },
    ]
    setGuides(sampleGuides)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const arrivedGuides = guides.filter((g) => g.status === "arrived")
  const pendingGuides = guides.filter((g) => g.status === "pending")

  return (
    <div className="container mx-auto p-6 space-y-6 bg-background text-foreground">
      <div className="flex items-center gap-3 mb-6">
        <Image
          src="/unlimited-cargo-logo.png"
          alt="Unlimited Cargo Logo"
          width={48}
          height={48}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-3xl font-bold">Monitor de Guías TCA</h1>
          <p className="text-muted-foreground">Verificación automática de guías aéreas</p>
        </div>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="bg-secondary rounded-lg">
          {" "}
          {/* Añadido rounded-lg aquí */}
          <TabsTrigger
            value="monitor"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            Monitor
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            Historial
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            Configuración
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            Notificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-6">
          <Card className="bg-card text-card-foreground border-border rounded-lg">
            <CardHeader>
              <CardTitle>Cargar Guías desde Excel</CardTitle>
              <CardDescription>
                Sube un archivo Excel con los números de guía a monitorear. Columnas esperadas: GUIA, Descripción,
                Origen, Destino
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">Archivo Excel</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={loading || isMonitoring}
                    className="border-input bg-input text-foreground rounded-md"
                  />
                </div>

                <div className="flex gap-4 flex-wrap">
                  <Button
                    onClick={startMonitoring}
                    disabled={isMonitoring || guides.length === 0}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Monitoreo
                  </Button>
                  <Button
                    onClick={stopMonitoring}
                    disabled={!isMonitoring}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10 bg-transparent rounded-md"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Detener Monitoreo
                  </Button>
                  <Button
                    onClick={checkAllGuides}
                    disabled={loading || guides.length === 0}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10 bg-transparent rounded-md"
                  >
                    Verificar Ahora
                  </Button>
                  <Button
                    onClick={createSampleData}
                    disabled={isMonitoring}
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md"
                  >
                    Datos de Ejemplo
                  </Button>
                  {guides.length > 0 && (
                    <Alert className="bg-accent/10 text-accent-foreground border-accent rounded-lg">
                      <FileText className="h-4 w-4" />
                      <AlertDescription>Se cargaron {guides.length} guías válidas del archivo Excel</AlertDescription>
                    </Alert>
                  )}
                </div>

                {error && (
                  <Alert className="bg-destructive text-destructive-foreground border-destructive-foreground rounded-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isMonitoring && (
                  <Alert className="bg-primary/10 text-primary border-primary rounded-lg">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Monitoreo activo - Verificando cada {settings.checkInterval} minutos
                      {lastUpdate && ` • Última verificación: ${lastUpdate.toLocaleTimeString()}`}
                    </AlertDescription>
                  </Alert>
                )}

                {loading && (
                  <Alert className="bg-primary/10 text-primary border-primary rounded-lg">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>Verificando guías... Procesando fila por fila</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {guides.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card text-card-foreground border-border rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{pendingGuides.length}</p>
                        <p className="text-sm text-muted-foreground">Pendientes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card text-card-foreground border-border rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-2xl font-bold">{arrivedGuides.length}</p>
                        <p className="text-sm text-muted-foreground">Listas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card text-card-foreground border-border rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{guides.length}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card text-card-foreground border-border rounded-lg">
                <CardHeader>
                  <CardTitle>Estado de Guías</CardTitle>
                  <CardDescription>Formato TCA: Primeros 3 caracteres + resto sin guión</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary hover:bg-secondary">
                          <TableHead>Número de Guía</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Última Verificación</TableHead>
                          <TableHead>Fecha Lista</TableHead>
                          <TableHead>Vuelo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guides.map((guide, index) => {
                          const StatusIcon = statusConfig[guide.status]?.icon || Clock
                          return (
                            <TableRow key={index} className="border-border hover:bg-accent/10">
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-bold">{guide.guideNumber}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {guide.guidePrefix} - {guide.guideSuffix}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${statusConfig[guide.status]?.color} rounded-full`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[guide.status]?.label}
                                </Badge>
                              </TableCell>
                              <TableCell>{guide.lastChecked ? guide.lastChecked.toLocaleTimeString() : "-"}</TableCell>
                              <TableCell>{guide.arrivedAt ? guide.arrivedAt.toLocaleString() : "-"}</TableCell>
                              <TableCell>{guide.tcaData ? guide.tcaData.numeroTransporte : "-"}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-card text-card-foreground border-border rounded-lg">
            <CardHeader>
              <CardTitle>Historial de Verificaciones</CardTitle>
              <CardDescription>Guías Listas vs. Pendientes por día</CardDescription>
            </CardHeader>
            <CardContent>
              {historyData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={historyData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="arrived" name="Listas" fill="hsl(var(--accent))" />
                      <Bar dataKey="pending" name="Pendientes" fill="hsl(var(--primary))" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay datos históricos aún. Inicia el monitoreo para generar datos.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-card text-card-foreground border-border rounded-lg">
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Configura cómo y cuándo recibir alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Recibir emails cuando las guías arriben</p>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
                  />
                </div>

                {settings.emailEnabled && (
                  <div>
                    <Label htmlFor="email">Dirección de Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.emailAddress}
                      onChange={(e) => setSettings({ ...settings, emailAddress: e.target.value })}
                      placeholder="tu@email.com"
                      className="border-input bg-input text-foreground rounded-md"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sonido de Notificación</Label>
                    <p className="text-sm text-muted-foreground">Reproducir sonido cuando las guías arriben</p>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                  />
                </div>

                <div>
                  <Label htmlFor="interval">Intervalo de Verificación</Label>
                  <Select
                    value={settings.checkInterval.toString()}
                    onValueChange={(value) => setSettings({ ...settings, checkInterval: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="border-input bg-input text-foreground rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground rounded-md">
                      <SelectItem value="1">1 minuto</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground border-border rounded-lg">
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Detección basada en portal TCA (simulada para preview):</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>Lista:</strong> Simula pantalla con información completa de la guía
                  </li>
                  <li>
                    <strong>Pendiente:</strong> Simula pantalla "ERROR - Guía no encontrada"
                  </li>
                </ul>
                <p>**Nota:** La guía `045-12195385` siempre figurará como "Pendiente" en esta simulación.</p>
                <p>
                  **Historial:** Los datos históricos se guardan en el navegador (`localStorage`) y no son persistentes
                  entre diferentes dispositivos o sesiones de incógnito. Para producción, se requiere una base de datos.
                </p>
                <p>
                  **Web Scraper:** La integración con el web scraper real (Puppeteer) se ejecuta en el servidor y no
                  puede ser previsualizada directamente aquí.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card text-card-foreground border-border rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Notificaciones</CardTitle>
                <CardDescription>{notifications.length} notificaciones</CardDescription>
              </div>
              <Button
                onClick={clearNotifications}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10 bg-transparent rounded-md"
              >
                Limpiar
              </Button>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((notification, index) => (
                    <Alert key={index} className="bg-accent/10 text-accent-foreground border-accent rounded-lg">
                      <Bell className="h-4 w-4" />
                      <AlertDescription>{notification}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay notificaciones</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

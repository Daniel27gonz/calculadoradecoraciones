import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Download, Eye, Upload, X, Image, Info, Save, Palette } from "lucide-react";
import QuoteTemplatePreview from "@/components/design/QuoteTemplatePreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuote } from "@/contexts/QuoteContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getCurrencyByCode } from "@/lib/currencies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface AdditionalService {
  id: string;
  description: string;
  price: number;
}

export interface PdfColors {
  header: string;
  titles: string;
  lines: string;
  finalPrice: string;
}

export const defaultPdfColors: PdfColors = {
  header: "#fce4ec",
  titles: "#db2777",
  lines: "#f9a8d4",
  finalPrice: "#db2777",
};

export interface QuoteTemplateData {
  folio?: number;
  businessName: string;
  businessLogo: string;
  quoteDate: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventLocation: string;
  decorationType: string;
  decorationDescription?: string;
  items: QuoteItem[];
  additionalServices: AdditionalService[];
  depositPercentage: number;
  depositMessage: string;
  thankYouMessage: string;
  customNote: string;
  currencySymbol: string;
  validUntil: string;
  pdfColors: PdfColors;
  costSummary?: {
    totalMaterials: number;
    totalReusableMaterials: number;
    wastage: number;
    wastagePercentage: number;
    totalLabor: number;
    totalTransport: number;
    totalExtras: number;
    indirectExpenses: number;
    totalCost: number;
    marginPercentage: number;
    finalPrice: number;
  };
}

const Design = () => {
  const { user, profile } = useAuth();
  const { quotes, calculateCosts } = useQuote();
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [templateData, setTemplateData] = useState<QuoteTemplateData>({
    businessName: profile?.business_name || "Mi Negocio",
    businessLogo: profile?.logo_url || "",
    quoteDate: new Date().toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    clientName: "",
    clientPhone: "",
    eventDate: "",
    eventLocation: "",
    decorationType: "",
    items: [
      { id: "1", description: "", quantity: 1, price: 0 },
    ],
    additionalServices: [],
    depositPercentage: 50,
    depositMessage: "Se solicita un anticipo del {percentage}% para confirmar la fecha",
    thankYouMessage: "¡Gracias por confiar en mí para hacer tu evento especial!",
    customNote: "Esta cotización está cuidadosamente diseñada para adaptarse a tus necesidades y brindarte la mejor decoración que siempre soñaste.",
    currencySymbol: "$",
    validUntil: "",
    pdfColors: { ...defaultPdfColors },
  });

  // Load profile data and design config when available
  useEffect(() => {
    if (profile) {
      const currency = getCurrencyByCode(profile.currency || 'USD');
      const savedColors = (profile as any).pdf_colors;
      setTemplateData(prev => ({
        ...prev,
        businessName: profile.business_name || prev.businessName,
        businessLogo: profile.logo_url || prev.businessLogo,
        depositPercentage: (profile as any).design_deposit_percentage ?? prev.depositPercentage,
        depositMessage: (profile as any).design_deposit_message || prev.depositMessage,
        customNote: (profile as any).design_additional_notes || prev.customNote,
        currencySymbol: currency?.symbol || '$',
        pdfColors: savedColors ? { ...defaultPdfColors, ...savedColors } : prev.pdfColors,
      }));
    }
  }, [profile]);

  // Save design config to profile
  const saveDesignConfig = async () => {
    if (!user) return;
    
    setIsSavingConfig(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          design_deposit_percentage: templateData.depositPercentage,
          design_deposit_message: templateData.depositMessage,
          design_additional_notes: templateData.customNote,
          pdf_colors: templateData.pdfColors as any,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "Tus preferencias de diseño se han guardado correctamente",
      });
    } catch (error) {
      console.error("Error saving design config:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Track last loaded quote to prevent duplicate notifications
  const lastLoadedQuoteIdRef = useRef<string | null>(null);

  // Load selected quote data into template
  useEffect(() => {
    if (selectedQuoteId && selectedQuoteId !== lastLoadedQuoteIdRef.current) {
      const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
      if (selectedQuote) {
        lastLoadedQuoteIdRef.current = selectedQuoteId;
        
        // Format event date
        let formattedEventDate = "";
        if (selectedQuote.eventDate) {
          try {
            formattedEventDate = format(new Date(selectedQuote.eventDate), "d 'de' MMMM 'de' yyyy", { locale: es });
          } catch {
            formattedEventDate = selectedQuote.eventDate;
          }
        }

        // Calculate final price from the quote
        const costs = calculateCosts(selectedQuote);
        const finalPrice = costs.finalPrice;

        // Build service items list matching the image quote format
        const items: QuoteItem[] = [];

        // Descripción de la decoración como primera fila
        if (selectedQuote.decorationDescription) {
          items.push({ id: 'decoration-desc', description: selectedQuote.decorationDescription, quantity: 0, price: 0 });
        }

        // Balloons
        selectedQuote.balloons.forEach((b) => {
          items.push({ id: b.id, description: b.description, quantity: b.quantity, price: b.pricePerUnit * b.quantity });
        });

        // Furniture
        selectedQuote.furnitureItems.forEach((f) => {
          items.push({ id: f.id, description: f.name, quantity: f.quantity, price: f.pricePerUnit * f.quantity });
        });

        // Reusable materials
        selectedQuote.reusableMaterialsUsed.forEach((r) => {
          items.push({ id: r.id, description: r.name, quantity: r.quantity, price: r.costPerUse * r.quantity });
        });

        // Ayudante (agrupado)
        if (selectedQuote.workers.length > 0) {
          const totalWorkerPrice = selectedQuote.workers.reduce((sum, w) => sum + w.hourlyRate * w.hours, 0);
          items.push({ id: 'ayudante', description: 'Ayudante', quantity: selectedQuote.workers.length, price: totalWorkerPrice });
        }

        // Extras
        selectedQuote.extras.forEach((e) => {
          items.push({ id: e.id, description: e.name, quantity: e.quantity, price: e.pricePerUnit * e.quantity });
        });

        // Transporte
        if (selectedQuote.transportItems.length > 0) {
          const totalTransport = selectedQuote.transportItems.reduce((sum, t) => sum + (t.amountIda || 0) + (t.amountRegreso || 0), 0);
          items.push({ id: 'transporte', description: 'Transporte', quantity: 0, price: totalTransport });
        }

        // Montaje y Desmontaje
        const setupPhase = selectedQuote.timePhases.find(p => p.phase === 'setup');
        const teardownPhase = selectedQuote.timePhases.find(p => p.phase === 'teardown');
        if (setupPhase && setupPhase.hours > 0) {
          items.push({ id: 'montaje', description: 'Montaje', quantity: 0, price: setupPhase.hours * setupPhase.rate });
        }
        if (teardownPhase && teardownPhase.hours > 0) {
          items.push({ id: 'desmontaje', description: 'Desmontaje', quantity: 0, price: teardownPhase.hours * teardownPhase.rate });
        }

        setTemplateData(prev => ({
          ...prev,
          folio: selectedQuote.folio,
          clientName: selectedQuote.clientName,
          clientPhone: selectedQuote.clientPhone || "",
          eventDate: formattedEventDate,
          decorationType: selectedQuote.eventType || "",
          decorationDescription: selectedQuote.decorationDescription || "",
          items,
          additionalServices: [],
          costSummary: {
            totalMaterials: costs.totalMaterials,
            totalReusableMaterials: costs.totalReusableMaterials,
            wastage: costs.wastage,
            wastagePercentage: selectedQuote.wastagePercentage || 0,
            totalLabor: costs.totalLabor,
            totalTransport: costs.totalTransport,
            totalExtras: costs.totalExtras,
            indirectExpenses: costs.indirectExpenses,
            totalCost: costs.totalCost,
            marginPercentage: selectedQuote.marginPercentage || 0,
            finalPrice: costs.finalPrice,
          },
        }));

        toast({
          title: "Datos cargados",
          description: `Se cargaron los datos de la cotización de ${selectedQuote.clientName}`,
        });
      }
    }
  }, [selectedQuoteId, quotes]);

  const updateField = <K extends keyof QuoteTemplateData>(
    field: K,
    value: QuoteTemplateData[K]
  ) => {
    setTemplateData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      price: 0,
    };
    updateField("items", [...templateData.items, newItem]);
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    updateField(
      "items",
      templateData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (id: string) => {
    if (templateData.items.length > 1) {
      updateField(
        "items",
        templateData.items.filter((item) => item.id !== id)
      );
    }
  };

  const addService = () => {
    const newService: AdditionalService = {
      id: Date.now().toString(),
      description: "",
      price: 0,
    };
    updateField("additionalServices", [...templateData.additionalServices, newService]);
  };

  const updateService = (id: string, field: keyof AdditionalService, value: string | number) => {
    updateField(
      "additionalServices",
      templateData.additionalServices.map((service) =>
        service.id === id ? { ...service, [field]: value } : service
      )
    );
  };

  const removeService = (id: string) => {
    updateField(
      "additionalServices",
      templateData.additionalServices.filter((service) => service.id !== id)
    );
  };

  const calculateTotal = () => {
    const itemsTotal = templateData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const servicesTotal = templateData.additionalServices.reduce(
      (sum, service) => sum + service.price,
      0
    );
    return itemsTotal + servicesTotal;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El logo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato no válido",
        description: "Por favor sube una imagen (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para subir un logo",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("business-logos")
        .getPublicUrl(fileName);

      updateField("businessLogo", publicUrl);

      toast({
        title: "Logo subido",
        description: "Tu logo se ha guardado correctamente",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error al subir",
        description: "No se pudo subir el logo. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
      // Reset input
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!user) return;

    try {
      // List all files in user's folder and delete them
      const { data: files } = await supabase.storage
        .from("business-logos")
        .list(user.id);

      if (files && files.length > 0) {
        const filesToDelete = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("business-logos").remove(filesToDelete);
      }

      updateField("businessLogo", "");

      toast({
        title: "Logo eliminado",
        description: "El logo ha sido eliminado",
      });
    } catch (error) {
      console.error("Error removing logo:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el logo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 pt-16 md:pt-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 md:py-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Diseñador de Cotización
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Personaliza tu plantilla de cotización profesional
            </p>
          </div>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="gap-2 self-start sm:self-center"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Editar" : "Vista previa"}
          </Button>
        </div>

        {showPreview ? (
          <QuoteTemplatePreview data={templateData} total={calculateTotal()} />
        ) : (
          <div className="space-y-6">
            {/* Selector de Cotización */}
            {quotes.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Cargar datos de una cotización existente
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Selecciona una cotización para rellenar automáticamente los datos del cliente
                        </p>
                      </div>
                      <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
                        <SelectTrigger className="w-full md:w-80">
                          <SelectValue placeholder="Seleccionar cotización..." />
                        </SelectTrigger>
                        <SelectContent>
                          {quotes.map((quote) => (
                            <SelectItem key={quote.id} value={quote.id}>
                              {quote.clientName} - {quote.eventDate || "Sin fecha"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Datos del Negocio */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-primary">
                  Datos del Negocio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Upload Section */}
                <div className="space-y-3">
                  <Label>Logo del negocio</Label>
                  <div className="flex items-start gap-4">
                    {/* Logo Preview */}
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center bg-muted/30 overflow-hidden">
                      {templateData.businessLogo ? (
                        <img
                          src={templateData.businessLogo}
                          alt="Logo del negocio"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={logoInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="gap-2"
                      >
                        {isUploadingLogo ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Subir logo
                          </>
                        )}
                      </Button>
                      {templateData.businessLogo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                          Quitar logo
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Formatos: JPG, PNG, GIF, WebP. Máximo 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del negocio</Label>
                    <Input
                      value={templateData.businessName}
                      onChange={(e) => updateField("businessName", e.target.value)}
                      placeholder="Ej: Globopolis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de cotización</Label>
                    <Input
                      value={templateData.quoteDate}
                      onChange={(e) => updateField("quoteDate", e.target.value)}
                      placeholder="Ej: 2 de Mayo de 2024"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos del Cliente */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-primary">
                  Datos del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del cliente</Label>
                    <Input
                      value={templateData.clientName}
                      onChange={(e) => updateField("clientName", e.target.value)}
                      placeholder="Ej: María López"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={templateData.clientPhone}
                      onChange={(e) => updateField("clientPhone", e.target.value)}
                      placeholder="Ej: +52 555 123 4567"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha del evento</Label>
                    <Input
                      value={templateData.eventDate}
                      onChange={(e) => updateField("eventDate", e.target.value)}
                      placeholder="Ej: 10 de junio de 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lugar del evento</Label>
                    <Input
                      value={templateData.eventLocation}
                      onChange={(e) => updateField("eventLocation", e.target.value)}
                      placeholder="Ej: Salón Villa Alegría, CDMX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tema o tipo de decoración</Label>
                  <Input
                    value={templateData.decorationType}
                    onChange={(e) => updateField("decorationType", e.target.value)}
                    placeholder="Ej: Fiesta infantil temática de unicornio"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Servicios Adicionales */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-primary">
                  Servicios Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {templateData.additionalServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay servicios adicionales
                  </p>
                ) : (
                  templateData.additionalServices.map((service, index) => (
                    <div
                      key={service.id}
                      className="space-y-3 p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Servicio {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(service.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Input
                            value={service.description}
                            onChange={(e) =>
                              updateService(service.id, "description", e.target.value)
                            }
                            placeholder="Ej: Transporte fuera de la ciudad"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio</Label>
                          <Input
                            type="number"
                            min="0"
                            value={service.price || ""}
                            onChange={(e) =>
                              updateService(
                                service.id,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="$0"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <Button
                  variant="outline"
                  onClick={addService}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar servicio adicional
                </Button>
              </CardContent>
            </Card>

            {/* Mensajes Personalizados */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-primary">
                  Mensajes Personalizados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Porcentaje de anticipo</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={templateData.depositPercentage}
                      onChange={(e) =>
                        updateField("depositPercentage", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mensaje de anticipo</Label>
                  <Input
                    value={templateData.depositMessage}
                    onChange={(e) => updateField("depositMessage", e.target.value)}
                    placeholder="Usa {percentage} para el porcentaje"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nota personalizada</Label>
                  <Textarea
                    value={templateData.customNote}
                    onChange={(e) => updateField("customNote", e.target.value)}
                    placeholder="Mensaje especial para tus clientes..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Válido hasta</Label>
                  <Input
                    type="date"
                    value={templateData.validUntil}
                    onChange={(e) => updateField("validUntil", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Fecha límite de validez de la cotización
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Mensaje de agradecimiento</Label>
                  <Input
                    value={templateData.thankYouMessage}
                    onChange={(e) => updateField("thankYouMessage", e.target.value)}
                    placeholder="Ej: ¡Gracias por confiar en mí!"
                  />
                </div>
                <Separator className="my-4" />
                <Button
                  onClick={saveDesignConfig}
                  disabled={isSavingConfig}
                  className="w-full gap-2"
                >
                  {isSavingConfig ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar configuración
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Los mensajes personalizados y el porcentaje de anticipo se guardarán en tu perfil
                </p>
              </CardContent>
            </Card>

            {/* Total */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total de la cotización:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${calculateTotal().toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
};

export default Design;

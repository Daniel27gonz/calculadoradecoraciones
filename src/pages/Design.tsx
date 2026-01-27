import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Download, Eye, Upload, X, Image } from "lucide-react";
import QuoteTemplatePreview from "@/components/design/QuoteTemplatePreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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

export interface QuoteTemplateData {
  businessName: string;
  businessLogo: string;
  quoteDate: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventLocation: string;
  decorationType: string;
  items: QuoteItem[];
  additionalServices: AdditionalService[];
  depositPercentage: number;
  depositMessage: string;
  thankYouMessage: string;
  customNote: string;
}

const Design = () => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [templateData, setTemplateData] = useState<QuoteTemplateData>({
    businessName: "Mi Negocio",
    businessLogo: "",
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
  });

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
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Diseñador de Cotización
            </h1>
            <p className="text-muted-foreground text-sm">
              Personaliza tu plantilla de cotización profesional
            </p>
          </div>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Editar" : "Vista previa"}
          </Button>
        </div>

        {showPreview ? (
          <QuoteTemplatePreview data={templateData} total={calculateTotal()} />
        ) : (
          <div className="space-y-6">
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

            {/* Items de la Cotización */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-primary">
                  Productos y Servicios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {templateData.items.map((item, index) => (
                  <div key={item.id} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {templateData.items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1 space-y-2">
                        <Label>Descripción</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          placeholder="Ej: Arreglo de globos básico"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.price || ""}
                          onChange={(e) =>
                            updateItem(item.id, "price", parseFloat(e.target.value) || 0)
                          }
                          placeholder="$0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addItem}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar item
                </Button>
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
                  <Label>Mensaje de agradecimiento</Label>
                  <Input
                    value={templateData.thankYouMessage}
                    onChange={(e) => updateField("thankYouMessage", e.target.value)}
                    placeholder="Ej: ¡Gracias por confiar en mí!"
                  />
                </div>
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

            {/* Acciones */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowPreview(true)}
                className="flex-1 gap-2"
              >
                <Eye className="w-4 h-4" />
                Ver Vista Previa
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Design;

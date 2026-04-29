import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAccessControl } from "@/hooks/use-access-control";

interface Props {
  itemId: string;
  accept?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  onUploaded: (publicUrl: string, file: File) => void;
  readOnly?: boolean;
}

const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;

async function loadImage(file: File) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao ler a imagem."));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

type SourceImage = ImageBitmap | HTMLImageElement;

async function compressImageFile(file: File) {
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 400_000 && file.type === "image/webp") return file;

  const source = (await loadImage(file)) as SourceImage;
  const width = source instanceof ImageBitmap ? source.width : source.naturalWidth;
  const height = source instanceof ImageBitmap ? source.height : source.naturalHeight;
  const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), "image/webp", IMAGE_QUALITY);
  });

  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}

export function FileUploader({
  itemId,
  accept = "*/*",
  label = "Enviar arquivo",
  variant = "outline",
  onUploaded,
  readOnly,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const { canManageInventory } = useAccessControl();
  const isReadOnly = readOnly ?? !canManageInventory;

  const handle = async (e: ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      toast.error("Seu acesso é somente consulta.");
      if (ref.current) ref.current.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const uploadFile = file.type.startsWith("image/") ? await compressImageFile(file) : file;
      const ext = uploadFile.name.split(".").pop() ?? "bin";
      const path = `${itemId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("item-files")
        .upload(path, uploadFile, { upsert: false, contentType: uploadFile.type });
      if (error) throw error;
      const { data } = supabase.storage.from("item-files").getPublicUrl(path);
      onUploaded(data.publicUrl, file);
      if (uploadFile !== file) {
        toast.success("Imagem comprimida e enviada");
      } else {
        toast.success("Arquivo enviado");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setLoading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handle} />
      <Button
        type="button"
        variant={variant}
        className="gap-2"
        disabled={loading || isReadOnly}
        onClick={() => ref.current?.click()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {label}
      </Button>
    </>
  );
}

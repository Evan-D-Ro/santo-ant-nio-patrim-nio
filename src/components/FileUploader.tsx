import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  itemId: string;
  accept?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  onUploaded: (publicUrl: string, file: File) => void;
}

export function FileUploader({
  itemId,
  accept = "*/*",
  label = "Enviar arquivo",
  variant = "outline",
  onUploaded,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${itemId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("item-files")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("item-files").getPublicUrl(path);
      onUploaded(data.publicUrl, file);
      toast.success("Arquivo enviado");
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
        disabled={loading}
        onClick={() => ref.current?.click()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {label}
      </Button>
    </>
  );
}

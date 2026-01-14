// Placeholder for a real PDF viewer component using iframe or react-pdf
export function PDFPreview({ url }: { url: string }) {
  return (
    <div className="w-full h-[600px] border rounded bg-gray-100 flex items-center justify-center">
        <iframe src={url} className="w-full h-full" title="PDF Preview" />
    </div>
  );
}

import { Upload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type DropzoneProps = {
  onDrop?: (acceptedFiles: File[]) => void;
};

const Dropzone: React.FC<DropzoneProps> = ({ onDrop }) => {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      onDrop?.(acceptedFiles);
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center max-w-md  w-full p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-gray-100"
      } hover:border-blue-500 hover:bg-blue-50`}
    >
      <input {...getInputProps()} />
      <Upload className="w-10 h-10 text-gray-500" />
      <p className="mt-2 text-gray-700 text-sm">
        {isDragActive
          ? "Drop the files here..."
          : "Drag & drop an image here, or click to select"}
      </p>
    </div>
  );
};

export default Dropzone;

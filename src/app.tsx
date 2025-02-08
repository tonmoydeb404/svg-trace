import { Posterizer } from "potrace";
import { useState } from "react";
import Dropzone from "./components/dropzone";
import Traces from "./components/traces";

type Props = {};
type FileType = File & { preview: string };

const App = (_props: Props) => {
  const [file, setFile] = useState<FileType | null>(null);
  const [svgs, setSvgs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------------------------

  const onDrop = (files: File[]) => {
    const selected = files[0];

    if (!selected) return;

    setFile({ ...selected, preview: URL.createObjectURL(selected) });
  };

  const clearFile = () => {
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
    setSvgs([]);
    setLoading(false);
  };

  const getSVG = () => {
    setSvgs([]);

    const image = file?.preview;

    if (!image) {
      alert("Please select an valid image");
      return;
    }

    setLoading(true);
    const trace = new Posterizer();

    trace.loadImage(image, (_, error) => {
      if (error) {
        console.error("Trace Error: ", error);
        setLoading(false);
        return;
      }

      trace.setParameters({
        threshold: 200,
      });

      const content = trace.getSVG();

      setSvgs((prev) => [...prev, content]);
      setLoading(false);
    });
  };

  return (
    <div className="grid grid-cols-2 w-full h-screen">
      <div className="px-10">
        <h1 className="font-bold text-3xl mt-7 mb-14">Trace SVG</h1>

        {!file && <Dropzone onDrop={onDrop} />}
        {file && (
          <>
            <img src={file.preview} alt="Preview" className="max-w-md mb-5" />

            <div className="flex items-center flex-wrap gap-2 mb-5">
              <button
                className="btn border-amber-600  bg-amber-500/10 hover:bg-amber-500 hover:text-white  text-amber-700"
                onClick={getSVG}
              >
                Generate SVG
              </button>
              <button className="btn border-blue-600  bg-blue-500/10 hover:bg-blue-500 hover:text-white  text-blue-700">
                Generate Color SVG
              </button>
              <button
                className="btn border-red-600  bg-red-500/10 hover:bg-red-500 hover:text-white  text-red-700"
                onClick={clearFile}
              >
                Remove
              </button>
            </div>
          </>
        )}
      </div>
      <div className="border-l px-10">
        <h3 className="font-bold text-3xl mt-7 mb-14">Previews</h3>
        {loading && <div>Processing</div>}
        {!loading && svgs.length > 0 && <Traces svgs={svgs} />}
      </div>
    </div>
  );
};

export default App;

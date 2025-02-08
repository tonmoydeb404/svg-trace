import { LucideCopy, LucideDownload } from "lucide-react";

type Props = {
  svgs: string[];
};

const Traces = (props: Props) => {
  const { svgs } = props;

  const downloadSVG = (src: string) => {
    if (!svgs) return;

    const blob = new Blob([src], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `svg-${Date.now()}.svg`; // Name of the downloaded file
    link.click();
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  const copySvg = (src: string) => {
    navigator.clipboard.writeText(src);
    alert("SVG copied to clipboard!");
  };

  return (
    <div className="flex items-center flex-wrap">
      {svgs.map((svg, index) => (
        <div key={index} className="relative">
          <div
            dangerouslySetInnerHTML={{ __html: svg }}
            className="w-md aspect-video border [&_svg]:max-w-full [&_svg]:max-h-full flex items-center justify-center flex-col"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              className="p-2 border hover:bg-black hover:text-white duration-200 cursor-pointer [&_svg]:size-4 rounded-lg"
              onClick={() => downloadSVG(svg)}
            >
              <LucideDownload />
            </button>
            <button
              className="p-2 border hover:bg-black hover:text-white duration-200 cursor-pointer [&_svg]:size-4 rounded-lg"
              onClick={() => copySvg(svg)}
            >
              <LucideCopy />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Traces;

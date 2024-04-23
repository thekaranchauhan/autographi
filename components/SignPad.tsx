"use client";

import React, { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
  color: string;
  lineWidth: number; // New property to store line width
}

const SignPad: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<Point[][]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string>("black");
  const [isCanvasBlank, setIsCanvasBlank] = useState<boolean>(true);
  const [isDrawingStarted, setIsDrawingStarted] = useState<boolean>(false);
  const [isEraserMode, setIsEraserMode] = useState<boolean>(false); // New state for eraser mode

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const context = canvas.getContext("2d");
      if (context) {
        setCtx(context);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    setIsDrawingStarted(true);
    if (ctx) {
      setIsDrawing(true);
      const currentPath: Point[] = [
        {
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY,
          color: isEraserMode ? "white" : selectedColor,
          lineWidth: isEraserMode ? 20 : 1, // Set line width based on eraser mode
        },
      ];
      setDrawingHistory([...drawingHistory, currentPath]);
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.strokeStyle = isEraserMode ? "white" : selectedColor;
      ctx.lineWidth = isEraserMode ? 20 : 1; // Set line width based on eraser mode
    }
  };

  const continueDrawing = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (isDrawing && ctx) {
      const currentPath = drawingHistory[drawingHistory.length - 1];
      const newPoint: Point = {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
        color: isEraserMode ? "white" : selectedColor,
        lineWidth: isEraserMode ? 20 : 1, // Set line width based on eraser mode
      };
      currentPath.push(newPoint);
      setDrawingHistory([...drawingHistory]);
      ctx.lineWidth = isEraserMode ? 20 : 1; // Set line width based on eraser mode
      ctx.lineTo(newPoint.x, newPoint.y);
      ctx.stroke();
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (ctx) ctx.closePath();
  };

  const handleUndo = () => {
    if (drawingHistory.length > 0 && ctx) {
      const updatedHistory = [...drawingHistory];
      updatedHistory.pop();
      setDrawingHistory(updatedHistory);
      redrawCanvas(updatedHistory);
    }
  };

  const handleRefresh = () => {
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      setDrawingHistory([]);
    }
    setIsCanvasBlank(true);
  };

  const redrawCanvas = (history: Point[][]) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    history.forEach((path) => {
      if (path.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        ctx.strokeStyle = path[0].color;
        ctx.lineWidth = path[0].lineWidth; // Set line width
        path.forEach((point) => {
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        });
        ctx.closePath();
      }
    });
  };

  const handleDownload = (format: string) => {
    if (!ctx || drawingHistory.length === 0) {
      return;
    }
  
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = ctx.canvas.width;
    tempCanvas.height = ctx.canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
  
    // Draw directly onto the temporary canvas
    drawingHistory.forEach((path) => {
      path.forEach((point, index) => {
        if (index === 0) {
          tempCtx.beginPath();
          tempCtx.moveTo(point.x, point.y);
          tempCtx.strokeStyle = point.color;
          tempCtx.lineWidth = point.lineWidth; // Set line width
        } else {
          tempCtx.lineTo(point.x, point.y);
          tempCtx.stroke();
        }
      });
      tempCtx.closePath();
    });
  
    // Convert the canvas to data URL and initiate download
    const dataURL = tempCanvas.toDataURL(`image/${format}`);
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `sign.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  const colors = ["black", "red", "navy"];
  const downloadFormats = ["png", "jpeg", "webp"];

  return (
    <div className="mt-8">
      <canvas
        ref={canvasRef}
        className="border border-gray-500 mx-auto"
        style={{
          display: "block",
          margin: "auto",
          width: "80vw",
          height: "60vh",
        }}
        onMouseDown={startDrawing}
        onMouseMove={continueDrawing}
        onMouseUp={endDrawing}
        onMouseOut={endDrawing}
      />
      <div className="flex justify-center mt-4">
        {colors.map((color, index) => (
          <div
            key={index}
            className="mx-2"
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: color,
              cursor: "pointer",
              boxShadow:
                selectedColor === color
                  ? "0 0 10px 5px rgba(0, 0, 0, 0.5)"
                  : "none",
            }}
            onClick={() => setSelectedColor(color)}
          ></div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <button
          onClick={handleUndo}
          className="bg-red-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Undo
        </button>
        <button
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Refresh
        </button>
        {/* Button for toggling eraser mode */}
        <button
          onClick={() => setIsEraserMode(!isEraserMode)}
          className={`bg-blue-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ${
            isEraserMode ? " animate-blink" : ""
          }`}
        >
          {isEraserMode ? "Exit Eraser" : "Eraser"}
        </button>
      </div>
      <div className="flex justify-center mt-4">
        {downloadFormats.map((format, index) => (
          <button
            key={index}
            onClick={() => handleDownload(format)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mx-2"
          >
            Download {format.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SignPad;

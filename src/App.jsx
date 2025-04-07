import { useState, useEffect, useRef } from "react";

const computeTraceSteps = (n) => {
  const traceSteps = [];
  const board = Array(n).fill(-1);

  const isSafe = (col, row) => {
    for (let prev = 0; prev < col; prev++) {
      if (board[prev] === row || Math.abs(board[prev] - row) === col - prev) {
        return false;
      }
    }
    return true;
  };

  const solve = (col) => {
    if (col === n) {
      traceSteps.push({ board: [...board], candidate: null, status: "solution" });
      return;
    }
    for (let row = 0; row < n; row++) {
      traceSteps.push({ board: [...board], candidate: { col, row }, status: "attempt" });
      if (isSafe(col, row)) {
        board[col] = row;
        traceSteps.push({ board: [...board], candidate: { col, row }, status: "placed" });
        solve(col + 1);
        board[col] = -1;
        traceSteps.push({ board: [...board], candidate: { col, row }, status: "backtrack" });
      }
    }
  };

  solve(0);
  return traceSteps;
};

const Board = ({ boardState, candidate, candidateStatus, n, cellSize = 40 }) => {
  return (
    <div
      className="grid border relative"
      style={{
        gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${n}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: n * n }).map((_, idx) => {
        const row = Math.floor(idx / n);
        const col = idx % n;
        const isQueen = boardState && boardState[col] === row;
        const baseColor = (row + col) % 2 === 0 ? "bg-gray-200" : "bg-gray-600";
        let overlay = null;
        if (candidate && candidate.col === col && candidate.row === row) {
          if (candidateStatus === "attempt") {
            overlay = <div className="absolute inset-0 bg-green-400 opacity-50 pointer-events-none"></div>;
          } else if (candidateStatus === "backtrack") {
            overlay = <div className="absolute inset-0 bg-red-500 opacity-50 pointer-events-none"></div>;
          }
        }
        return (
          <div
            key={idx}
            className={`relative flex items-center justify-center border ${baseColor}`}
            style={{ width: cellSize, height: cellSize }}
          >
            {isQueen && <span className="text-xl">♛</span>}
            {overlay}
          </div>
        );
      })}
    </div>
  );
};

const NQueenVisualizer = () => {
  const [n, setN] = useState(8);
  const [traceSteps, setTraceSteps] = useState([]);
  const [finalSolutions, setFinalSolutions] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState({ board: Array(n).fill(-1), candidate: null, status: null });
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [animateSlide, setAnimateSlide] = useState(false);
  const visualizeRef = useRef(false);

  useEffect(() => {
    setTraceSteps([]);
    setFinalSolutions([]);
    setCurrentStep({ board: Array(n).fill(-1), candidate: null, status: null });
    setShowThumbnails(true);
    setIsVisualizing(false);
  }, [n]);

  const handleFindSolutions = () => {
    const trace = computeTraceSteps(n);
    setTraceSteps(trace);
    const finals = trace.filter((step) => step.status === "solution").map((step) => step.board);
    setFinalSolutions(finals);
    setCurrentStepIndex(0);
    setCurrentStep({ board: Array(n).fill(-1), candidate: null, status: null });
  };

  const visualizeTrace = async () => {
    if (!traceSteps.length) return;
    setIsVisualizing(true);
    visualizeRef.current = true;
    setShowThumbnails(false);

    for (let i = 0; i < traceSteps.length; i++) {
      if (!visualizeRef.current) break;
      setCurrentStep(traceSteps[i]);
      setCurrentStepIndex(i);
      await new Promise((resolve) => setTimeout(resolve, speed));

      if (traceSteps[i].status === "solution") {
        await new Promise((resolve) => setTimeout(resolve, speed * 2));
        setAnimateSlide(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setAnimateSlide(false);
      }
    }

    setIsVisualizing(false);
    visualizeRef.current = false;
    setShowThumbnails(true);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex flex-col gap-2 items-center">
        <div className="flex gap-2 items-center">
          <label className="text-lg font-bold">Board Size (N):</label>
          <input
            type="number"
            min="4"
            max="12"
            value={n}
            onChange={(e) => setN(parseInt(e.target.value) || 4)}
            className="border rounded px-2 py-1 w-16"
            disabled={isVisualizing}
          />
          <button
            onClick={handleFindSolutions}
            disabled={isVisualizing}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            Find Solutions
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-lg font-bold">Speed (ms):</label>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-48"
            disabled={isVisualizing}
          />
          <span>{speed} ms</span>
        </div>
        <button
          onClick={visualizeTrace}
          disabled={traceSteps.length === 0 || isVisualizing}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isVisualizing ? "Visualizing..." : "Visualize"}
        </button>
      </div>

      {finalSolutions.length > 0 && (
        <div
          className={`w-full max-w-4xl transition-opacity duration-500 ${
            showThumbnails ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <p className="text-center font-bold">
            Total Solutions: {finalSolutions.length}
          </p>
          <div className="grid grid-cols-4 gap-2 overflow-auto max-h-96 border p-2">
            {finalSolutions.map((solution, idx) => (
              <div
                key={idx}
                className={`border ${idx === currentStepIndex ? "ring-2 ring-blue-500" : ""}`}
              >
                <Board boardState={solution} n={n} cellSize={20} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`mt-4 transition-transform duration-500 ${animateSlide ? "-translate-y-20" : "translate-y-0"}`}
      >
        <p className="font-bold">Visualization:</p>
        <Board
          boardState={currentStep.board}
          candidate={currentStep.candidate}
          candidateStatus={currentStep.status}
          n={n}
          cellSize={40}
        />
      </div>
    </div>
  );
};

export default NQueenVisualizer;

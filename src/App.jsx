import { useState, useEffect, useRef } from "react";

// Computes a complete trace of the algorithm.
// Each step records the current board, the candidate cell being checked, and a status.
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
      // Record a complete solution step.
      traceSteps.push({ board: [...board], candidate: null, status: "solution" });
      return;
    }
    for (let row = 0; row < n; row++) {
      // Record an attempt to place a queen at (col, row)
      traceSteps.push({ board: [...board], candidate: { col, row }, status: "attempt" });
      if (isSafe(col, row)) {
        board[col] = row;
        // Record that the queen has been placed.
        traceSteps.push({ board: [...board], candidate: { col, row }, status: "placed" });
        solve(col + 1);
        // Backtracking step: remove queen and record it.
        board[col] = -1;
        traceSteps.push({ board: [...board], candidate: { col, row }, status: "backtrack" });
      }
    }
  };

  solve(0);
  return traceSteps;
};

// Board component renders the grid.
// It now accepts an optional "candidate" with a status so that the currently tested cell is highlighted.
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
        // If this cell is currently being checked, show an overlay according to its status.
        if (candidate && candidate.col === col && candidate.row === row) {
          if (candidateStatus === "attempt") {
            overlay = <div className="absolute inset-0 bg-yellow-300 opacity-50 pointer-events-none"></div>;
          } else if (candidateStatus === "backtrack") {
            overlay = <div className="absolute inset-0 bg-blue-300 opacity-50 pointer-events-none"></div>;
          }
          // For "placed", we simply show the queen (already rendered) so no extra overlay.
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
  // The full trace of the algorithm's steps.
  const [traceSteps, setTraceSteps] = useState([]);
  // Final solutions (each final board from a "solution" step) for thumbnails.
  const [finalSolutions, setFinalSolutions] = useState([]);
  // Index in the traceSteps array.
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // The current step object: { board, candidate, status }
  const [currentStep, setCurrentStep] = useState({ board: Array(n).fill(-1), candidate: null, status: null });
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [speed, setSpeed] = useState(500); // delay in ms for each step
  const [showThumbnails, setShowThumbnails] = useState(true);
  // Controls the sliding animation for the visualization board.
  const [animateSlide, setAnimateSlide] = useState(false);
  const visualizeRef = useRef(false);

  // Reset when board size changes.
  useEffect(() => {
    setTraceSteps([]);
    setFinalSolutions([]);
    setCurrentStep({ board: Array(n).fill(-1), candidate: null, status: null });
    setShowThumbnails(true);
    setIsVisualizing(false);
  }, [n]);

  // When the user clicks "Find Solutions" compute the full trace and the final solutions.
  const handleFindSolutions = () => {
    const trace = computeTraceSteps(n);
    setTraceSteps(trace);
    const finals = trace.filter((step) => step.status === "solution").map((step) => step.board);
    setFinalSolutions(finals);
    setCurrentStepIndex(0);
    setCurrentStep({ board: Array(n).fill(-1), candidate: null, status: null });
  };

  // Animate the full trace.
  const visualizeTrace = async () => {
    if (!traceSteps.length) return;
    setIsVisualizing(true);
    visualizeRef.current = true;
    // Fade out thumbnails.
    setShowThumbnails(false);

    for (let i = 0; i < traceSteps.length; i++) {
      if (!visualizeRef.current) break;
      setCurrentStep(traceSteps[i]);
      setCurrentStepIndex(i);
      await new Promise((resolve) => setTimeout(resolve, speed));

      // When a complete solution is reached, pause extra and trigger a slide-up animation.
      if (traceSteps[i].status === "solution") {
        await new Promise((resolve) => setTimeout(resolve, speed * 2));
        setAnimateSlide(true);
        // Wait for the slide animation duration (e.g., 500ms)
        await new Promise((resolve) => setTimeout(resolve, 500));
        setAnimateSlide(false);
      }
    }

    setIsVisualizing(false);
    visualizeRef.current = false;
    // Fade thumbnails back in.
    setShowThumbnails(true);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Controls */}
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

      {/* Thumbnails of final solutions */}
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

      {/* Visualization Board with sliding animation */}
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

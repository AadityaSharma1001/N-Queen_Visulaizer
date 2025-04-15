import React, { useState, useRef, useEffect } from 'react';

// Helper: Array-based backtracking generator.
function* solveNQueensArray(n) {
  const board = new Array(n);
  function* backtrack(row) {
    if (row === n) {
      yield { board: board.slice(), action: "solution" };
      return;
    }
    for (let col = 0; col < n; col++) {
      let valid = true;
      for (let r = 0; r < row; r++) {
        if (board[r] === col || Math.abs(board[r] - col) === row - r) {
          valid = false;
          break;
        }
      }
      if (valid) {
        board[row] = col;
        yield { row, col, action: "place", board: board.slice() };
        yield* backtrack(row + 1);
        yield { row, col, action: "remove", board: board.slice() };
        board[row] = undefined;
      }
    }
  }
  yield* backtrack(0);
}

// Helper: Bitmasking backtracking generator.
function* solveNQueensBitmask(n) {
  const board = new Array(n);
  function* backtrack(row, columns, diag1, diag2) {
    if (row === n) {
      yield { board: board.slice(), action: "solution" };
      return;
    }
    let available = ((1 << n) - 1) & ~(columns | diag1 | diag2);
    while (available) {
      const pick = available & -available;
      const col = Math.log2(pick);
      board[row] = col;
      yield { row, col, action: "place", board: board.slice() };
      yield* backtrack(
        row + 1,
        columns | pick,
        (diag1 | pick) << 1,
        (diag2 | pick) >> 1
      );
      yield { row, col, action: "remove", board: board.slice() };
      board[row] = undefined;
      available &= available - 1;
    }
  }
  yield* backtrack(0, 0, 0, 0);
}

// Count solutions synchronously for Array-based approach.
function countSolutionsArray(n) {
  let count = 0;
  const board = new Array(n);
  function backtrack(row) {
    if (row === n) {
      count++;
      return;
    }
    for (let col = 0; col < n; col++) {
      let valid = true;
      for (let r = 0; r < row; r++) {
        if (board[r] === col || Math.abs(board[r] - col) === row - r) {
          valid = false;
          break;
        }
      }
      if (valid) {
        board[row] = col;
        backtrack(row + 1);
        board[row] = undefined;
      }
    }
  }
  backtrack(0);
  return count;
}

// Count solutions synchronously for Bitmasking approach.
function countSolutionsBitmask(n) {
  let count = 0;
  function backtrack(row, columns, diag1, diag2) {
    if (row === n) {
      count++;
      return;
    }
    let available = ((1 << n) - 1) & ~(columns | diag1 | diag2);
    while (available) {
      const pick = available & -available;
      available &= available - 1;
      backtrack(
        row + 1,
        columns | pick,
        (diag1 | pick) << 1,
        (diag2 | pick) >> 1
      );
    }
  }
  backtrack(0, 0, 0, 0);
  return count;
}

// Component to render a chess board with queens.
const Board = ({ board, n, highlightedCell }) => {
  const cellStyle =
    "w-12 h-12 flex justify-center items-center border border-gray-300 text-2xl transition-colors duration-200";
  const boardRows = [];
  for (let row = 0; row < n; row++) {
    const cells = [];
    for (let col = 0; col < n; col++) {
      const hasQueen = board && board[row] === col;
      const isHighlighted =
        highlightedCell &&
        highlightedCell.row === row &&
        highlightedCell.col === col;
      cells.push(
        <div
          key={col}
          className={`${cellStyle} ${isHighlighted ? "bg-blue-200" : "bg-white"}`}
        >
          {hasQueen ? "♛" : ""}
        </div>
      );
    }
    boardRows.push(
      <div key={row} className="flex">
        {cells}
      </div>
    );
  }
  return (
    <div className="inline-block shadow-lg rounded-md overflow-hidden">
      {boardRows}
    </div>
  );
};

const NQueensVisualizer = () => {
  const [queenCount, setQueenCount] = useState(4);
  const [speed, setSpeed] = useState(500); // delay in ms
  const [algorithm, setAlgorithm] = useState("array"); // 'array' or 'bitmasking'
  const [totalSolutions, setTotalSolutions] = useState(null);
  const [computeTime, setComputeTime] = useState(null);
  const [currentBoard, setCurrentBoard] = useState([]);
  const [highlight, setHighlight] = useState(null);
  const [solutions, setSolutions] = useState([]); // list of final solutions boards
  const [running, setRunning] = useState(false);
  const genRef = useRef(null);
  const speedRef = useRef(speed);

  // Update the speed reference every time speed changes.
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Compute statistics and count solutions.
  const computeStatistics = () => {
    const n = parseInt(queenCount);
    const startTime = performance.now();
    let count;
    if (algorithm === "array") {
      count = countSolutionsArray(n);
    } else {
      count = countSolutionsBitmask(n);
    }
    const endTime = performance.now();
    setTotalSolutions(count);
    setComputeTime((endTime - startTime).toFixed(2));
  };

  // Step through the generator for the animation.
  const stepGenerator = () => {
    if (!genRef.current) return;
    const next = genRef.current.next();
    if (!next.done) {
      const step = next.value;
      if (step.action === "place" || step.action === "remove") {
        setCurrentBoard(step.board);
        setHighlight({ row: step.row, col: step.col, action: step.action });
      }
      if (step.action === "solution") {
        setSolutions((prev) => [...prev, step.board]);
      }
      setTimeout(stepGenerator, speedRef.current); // read the current speed from ref
    } else {
      setRunning(false);
      setHighlight(null);
    }
  };

  const startVisualization = () => {
    setSolutions([]);
    setCurrentBoard(Array.from({ length: queenCount }, () => undefined));
    setTotalSolutions(null);
    setComputeTime(null);
    setHighlight(null);
    setRunning(true);

    computeStatistics();

    const n = parseInt(queenCount);
    if (algorithm === "array") {
      genRef.current = solveNQueensArray(n);
    } else {
      genRef.current = solveNQueensBitmask(n);
    }
    setTimeout(stepGenerator, speedRef.current);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-xl p-8 max-w-4xl w-full">
        <h2 className="text-3xl font-bold text-center mb-6">N-Queen Visualizer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-3">
              <span className="text-lg font-medium">Number of Queens:</span>
              <input
                type="number"
                min="4"
                value={queenCount}
                onChange={(e) => setQueenCount(e.target.value)}
                disabled={running}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              />
            </label>
            <label className="block mb-3">
              <span className="text-lg font-medium">Visualization Speed (ms):</span>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-gray-700">{speed} ms</span>
            </label>
            <label className="block mb-3">
              <span className="text-lg font-medium">Algorithm:</span>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                disabled={running}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="array">Array-based</option>
                <option value="bitmasking">Bitmasking</option>
              </select>
            </label>
            <button
              onClick={startVisualization}
              disabled={running}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              {running ? "Running..." : "Start"}
            </button>
          </div>
          <div className="flex flex-col items-center justify-center">
            {totalSolutions !== null && computeTime !== null && (
              <div className="bg-blue-50 p-4 rounded-md shadow-md w-full text-center">
                <h3 className="text-xl font-semibold mb-2">Statistics</h3>
                <p>
                  Total Solutions: <span className="font-medium">{totalSolutions}</span>
                </p>
                <p>
                  Time Taken: <span className="font-medium">{computeTime} ms</span>
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-center">Live Visualization</h3>
          <div className="flex justify-center">
            <Board
              board={currentBoard}
              n={parseInt(queenCount)}
              highlightedCell={highlight}
            />
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-center">Found Solutions</h3>
          {solutions.length === 0 ? (
            <p className="text-center text-gray-600">No complete solution yet.</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              {solutions.map((sol, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded-md shadow-md">
                  <Board board={sol} n={parseInt(queenCount)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NQueensVisualizer;

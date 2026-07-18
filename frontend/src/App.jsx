import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [view, setView] = useState('citizen'); // 'citizen' or 'admin'
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Admin states
  const [hotspots, setHotspots] = useState([]);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [letterLoading, setLetterLoading] = useState(false);

  // --- CITIZEN LOGIC ---
  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/extract", { text });
      setResult(response.data.data);
      setText(""); // clear input after submit
    } catch (error) {
      alert("Error: Backend se connect nahi ho paya!");
    } finally {
      setLoading(false);
    }
  };

  // --- ADMIN LOGIC ---
  const fetchHotspots = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/hotspots");
      setHotspots(response.data.data);
    } catch (error) {
      console.error("Failed to fetch hotspots");
    }
  };

  const handleGenerateLetter = async (location, resource) => {
    setLetterLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/generate-letter", {
        location: location,
        resource: resource
      });
      setGeneratedLetter(response.data.letter);
    } catch (error) {
      alert("Failed to generate letter");
    } finally {
      setLetterLoading(false);
    }
  };

  // Load hotspots when switching to admin view
  useEffect(() => {
    if (view === 'admin') {
      fetchHotspots();
    }
  }, [view]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      
      {/* Navbar / Tabs */}
      <div className="max-w-4xl mx-auto flex justify-center space-x-4 mb-8">
        <button 
          onClick={() => setView('citizen')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${view === 'citizen' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border'}`}
        >
          Citizen Portal
        </button>
        <button 
          onClick={() => setView('admin')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${view === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border'}`}
        >
          Admin Dashboard
        </button>
      </div>

      {/* CITIZEN VIEW */}
      {view === 'citizen' && (
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Resilink AI</h1>
          <p className="text-gray-500 text-center mb-6">File a Civic Complaint</p>
          
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="E.g., The gas agency in Limbayat hasn't had stock for 2 weeks..."
            className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full mt-4 py-3 rounded-xl font-semibold text-white ${loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg"}`}
          >
            {loading ? "Analyzing..." : "Submit Complaint"}
          </button>

          {result && (
            <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
              <h2 className="text-lg font-bold text-indigo-900 mb-4 border-b border-indigo-200 pb-2">Issue Logged Successfully</h2>
              <div className="space-y-2">
                <p><strong>Location:</strong> {result.location}</p>
                <p><strong>Resource:</strong> {result.resource_type}</p>
                <p><strong>Severity:</strong> <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">{result.severity}</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN VIEW */}
      {view === 'admin' && (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Crisis Hotspots</h2>
          
          {/* Hotspots Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                  <th className="p-4 rounded-tl-lg">Location</th>
                  <th className="p-4">Resource Issue</th>
                  <th className="p-4">Complaints Count</th>
                  <th className="p-4 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.map((spot, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-800">{spot.location}</td>
                    <td className="p-4 text-gray-600">{spot.resource}</td>
                    <td className="p-4 font-bold text-red-600">{spot.count}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleGenerateLetter(spot.location, spot.resource)}
                        className="px-4 py-2 bg-black text-white text-sm font-bold rounded hover:bg-gray-800 transition-colors"
                      >
                        {letterLoading ? 'Drafting...' : 'Generate Letter'}
                      </button>
                    </td>
                  </tr>
                ))}
                {hotspots.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">No complaints registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* AI Generated Letter Display */}
          {generatedLetter && (
            <div className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
              <h3 className="text-lg font-bold text-yellow-900 mb-4 border-b border-yellow-200 pb-2">AI Drafted Letter for Collector</h3>
              <pre className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
                {generatedLetter}
              </pre>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default App;
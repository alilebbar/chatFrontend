import { useEffect, useRef, useState } from "react";

type Message = {
  sender: string;
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [color, setColor] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loder, setLoader] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // 👉 ref pour le scroll

  function isDark(hexColor: string): boolean {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 128;
  }

  const getData = async () => {
    try {
      setLoader(true);
      const response = await fetch(
        "https://chatbackend-17qz.onrender.com/api/messages"
      );
      const data = await response.json();
      setLoader(false);
      const formatted = data.map(
        (msg: { sender: string; content: string }) => ({
          sender: msg.sender,
          content: msg.content,
        })
      );
      setMessages(formatted);
    } catch (err) {
      console.error("❌ Erreur lors du chargement des messages :", err);
      setLoader(false);
    }
  };

  useEffect(() => {
    getData();

    ws.current = new WebSocket("wss://chatbackend-17qz.onrender.com");

    ws.current.onopen = () => {
      console.log("✅ WebSocket connecté");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setColor(data.color);
      setIsDarkMode(isDark(data.color));
      setMessages((prev) => [
        ...prev,
        { sender: data.color, content: data.message },
      ]);
    };

    ws.current.onclose = () => {
      console.log("🔌 WebSocket déconnecté");
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = color;
  }, [color]);

  // 👉 Scroll automatique en bas quand messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (ws.current && input.trim()) {
      setLoader(true);
      ws.current.send(input.trim());
      setInput("");
      setLoader(false);
    }
  };

  return (
    <>
      <h1
        className={`text-9xl playwrite-hu ${
          isDarkMode ? "text-white" : "text-black"
        }`}
      >
        Free chat
      </h1>
      <div className="p-4 max-w-xl mx-auto">
        <div className="border rounded h-80 overflow-y-scroll mb-4 p-2 space-y-2 bg-white shadow">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-md overflow-x-hidden ${
                isDark(msg.sender) ? "bg-gray-100" : "bg-gray-800"
              }`}
              style={{ color: msg.sender }}
            >
              {msg.content}
            </div>
          ))}
          {loder && <span className="text-center loader "></span>}
          <div ref={messagesEndRef} /> {/* 👈 Cible du scroll */}
        </div>

        <div className="flex gap-2 flex-col items-center sm:flex-row">
          <input
            type="text"
            className={`flex-1 border rounded p-2  ${
              isDarkMode ? "text-white border-white" : "text-black border-black"
            }`}
            placeholder="Votre message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            max={1000}
          />
          <button
            onClick={sendMessage}
            className={`px-4 py-2 rounded border-2 ${
              isDarkMode ? "text-white border-white" : "text-black border-black"
            } `}
            style={{ backgroundColor: color }}
          >
            Envoyer
          </button>
        </div>
      </div>
    </>
  );
}

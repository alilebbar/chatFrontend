import { useEffect, useRef, useState } from "react";

type Message = {
  sender: string; // correspond à la couleur
  content: string; // le message texte
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [color, setColor] = useState(""); // couleur par défaut
  const ws = useRef<WebSocket | null>(null);

  const getData = async () => {
    try {
      const response = await fetch("https://chatbackend-17qz.onrender.com/api/messages");
      const data = await response.json();

      const formatted = data.map(
        (msg: { sender: string; content: string }) => ({
          sender: msg.sender,
          content: msg.content,
        })
      );
      console.log("✅ Messages chargés :", formatted);
      setMessages(formatted);
    } catch (err) {
      console.error("❌ Erreur lors du chargement des messages :", err);
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

  const sendMessage = () => {
    if (ws.current && input.trim()) {
      ws.current.send(input.trim());
      setInput("");
    }
  };
  useEffect(() => {
    console.log("Couleur mise à jour :", color);
  document.body.style.backgroundColor = color;
}, [color]);


  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="border rounded h-80 overflow-y-scroll mb-4 p-2 space-y-2 bg-white shadow">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm" style={{ color: msg.sender }}>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Votre message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="hover:bg-blue-700 text-black px-4 py-2 rounded"
          style={{ backgroundColor: color  }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}

import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { useEffect, useState } from "react";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  MessageInput,
  Message,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

function App() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [typing, setTyping] = useState(false);
  const apiKey = import.meta.env.VITE_OPENAI_KEY;

  // get saved messages

  const getHistory = async () => {
    const items = await JSON.parse(localStorage.getItem("messages"));
    if (items) {
      setMessages(items);
      console.log(items);
    }
  };
  useEffect(() => {
    // on page refresh
    window.addEventListener("beforeunload", refresh);
    const items = localStorage.getItem("title");

    if (items) setHistory(items);

    if (showHistory === true) {
      getHistory();
    }
    return () => {
      window.removeEventListener("beforeunload", refresh);
    };
  }, [showHistory]);

  const handleHistory = () => {
    if (history.length > 0) {
      setShowHistory(true);
    }
    console.log(showHistory);
  };

  const handleSubmit = async (message) => {
    //  open ai
    const newMessage = {
      message: message,
      sender: "user",
      direction: "outgoing",
    };

    const newMessages = [...messages, newMessage];
    // update messages state
    setMessages(newMessages);

    // set typing indicator
    setTyping(true);
    setHistory(newMessage.message);

    localStorage.setItem("title", history);
    await processMessages(newMessages);
  };

  // process mesaage to chatgpt
  const processMessages = async (chatMessages) => {
    let apiMessages = chatMessages.map((messageObj) => {
      let role = "";
      if (messageObj.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObj.message };
    });

    // role: "user" =. a message from the user, 'assistant' =. a response from chatGpt
    // system == generally one initial message defining How we want chat gpt to talk
    const systemMessage = {
      role: "system",
      content: "Speak with british slangs",
    };
    const apiRequestBody = {
      model: "gpt-3.5-turbo",
      messages: [systemMessage, ...apiMessages],
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.6,
    };

    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    })
      .then((data) => {
        return data.json();
      })
      .then((data) => {
        // console.log(data);
        // console.log(data.choices[0].message.content);

        let message = data.choices[0].message.content;

        setMessages([
          ...chatMessages,
          {
            message: message,
            sender: "ChatGPT",
          },
        ]);

        setTyping(false);
        // save to local storage
        localStorage.setItem("messages", JSON.stringify(messages));
      })

      .catch((error) => {
        console.error(error);
      });
  };

  const refresh = () => {
    setMessages([]);
  };
  const clearChats = () => {
    setHistory([]);
    setMessages([]);
    localStorage.removeItem("title", "messages");
  };

  return (
    <div className="">
      <div className="header">
        <p style={{ textAlign: "center" }}>Welcome to ChatGeePeeTee 😃</p>
        <div className="btn">
          <button onClick={refresh} className="btn">
            New Chat
          </button>
          <br />

          <div className="history">
            <button className="his" onClick={handleHistory}>
              {history}
            </button>
          </div>
        </div>
        <button onClick={clearChats} className="clear">
          Clear chats
        </button>
      </div>
      <div className="wrapper">
        <div className="box">
          <MainContainer>
            <ChatContainer>
              <MessageList
                scrollBehavior="smooth"
                typingIndicator={
                  typing ? (
                    <TypingIndicator content="ChatGeePeeTee is typing" />
                  ) : null
                }
              >
                {messages.map((message, index) => (
                  <Message key={index} model={message} />
                ))}
              </MessageList>
              <MessageInput placeholder="Enter message" onSend={handleSubmit} />
            </ChatContainer>
          </MainContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
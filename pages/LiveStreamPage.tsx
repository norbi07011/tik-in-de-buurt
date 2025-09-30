



import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { VideoCameraIcon, VideoCameraSlashIcon, MicrophoneIcon, MicrophoneSlashIcon, EyeIcon, TagIcon, PinIcon, VerifiedIcon, PaperAirplaneIcon } from '../components/icons/Icons';
import { MOCK_LIVE_CHAT_MESSAGES } from '../src/constants';
import type { LiveChatMessage, Product, Business } from '../src/types';
import { useStore } from '../src/store';
import { api } from '../src/api';

const LiveStreamPage: React.FC = () => {
    const { t } = useTranslation();
    const user = useStore(state => state.user);
    const videoRef = useRef<HTMLVideoElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    const [isStreaming, setIsStreaming] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [streamTitle, setStreamTitle] = useState('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [business, setBusiness] = useState<Business | null>(null);
    
    const [products, setProducts] = useState<Product[]>([
        { name: "Vintage T-Shirt", price: "€25.00" },
        { name: "Denim Jacket", price: "€79.99" },
        { name: "Leather Boots", price: "€120.00" }
    ]);
    const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
    
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');

    const [activeTab, setActiveTab] = useState<'chat' | 'products'>('chat');
    
    // Live simulation state
    const [viewerCount, setViewerCount] = useState(0);
    const [liveTime, setLiveTime] = useState(0);
    const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
        const fetchBusiness = async () => {
            if (user?.businessId) {
                try {
                    const businessData = await api.fetchBusinessById(user.businessId.toString());
                    setBusiness(businessData);
                    setStreamTitle(`${t(businessData.nameKey)} Live Stream`);
                } catch (error) {
                    console.error("Failed to fetch business data", error);
                }
            }
        };
        fetchBusiness();
    }, [user, t]);
    
    useEffect(() => {
        let viewerInterval: ReturnType<typeof setInterval>;
        let timerInterval: ReturnType<typeof setInterval>;
        let chatInterval: ReturnType<typeof setInterval>;

        if (isStreaming) {
            setViewerCount(Math.floor(Math.random() * 50) + 25);
            setLiveTime(0);
            setChatMessages([]);

            viewerInterval = setInterval(() => {
                setViewerCount(v => Math.max(0, v + (Math.floor(Math.random() * 11) - 5)));
            }, 3000);

            timerInterval = setInterval(() => {
                setLiveTime(t => t + 1);
            }, 1000);
            
            let chatIndex = 0;
            chatInterval = setInterval(() => {
                if (chatIndex < MOCK_LIVE_CHAT_MESSAGES.length) {
                    setChatMessages(prev => [...prev, MOCK_LIVE_CHAT_MESSAGES[chatIndex]]);
                    chatIndex++;
                } else {
                    // Optional: loop chat for long streams
                    chatIndex = 0;
                }
            }, 4000);

        }

        return () => {
            clearInterval(viewerInterval);
            clearInterval(timerInterval);
            clearInterval(chatInterval);
        };
    }, [isStreaming]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleStopStreaming = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setStream(null);
        setIsStreaming(false);
    }, [stream]);

    const handleStartStreaming = async () => {
        if (!isCameraOn && !isMicOn) {
            useStore.getState().showToast(t('start_streaming_no_media_error'), "error");
            return;
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: isCameraOn,
                audio: isMicOn,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play().catch(e => console.error("Video play failed:", e));
            }
            setIsStreaming(true);
        } catch (err) {
            console.error("Error accessing media devices.", err);
            useStore.getState().showToast("Could not access camera/microphone. Check permissions.", "error");
        }
    };
    
    const toggleMediaDevice = async (device: 'camera' | 'mic') => {
        const newIsCameraOn = device === 'camera' ? !isCameraOn : isCameraOn;
        const newIsMicOn = device === 'mic' ? !isMicOn : isMicOn;

        setIsCameraOn(newIsCameraOn);
        setIsMicOn(newIsMicOn);

        if (isStreaming) {
            stream?.getTracks().forEach(track => track.stop());
            if (newIsCameraOn || newIsMicOn) {
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({
                        video: newIsCameraOn,
                        audio: newIsMicOn,
                    });
                    setStream(newStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = newStream;
                        videoRef.current.play().catch(e => console.error("Video play failed:", e));
                    }
                } catch (err) {
                    console.error("Error updating media stream.", err);
                    handleStopStreaming();
                    useStore.getState().showToast("Could not access devices. Stopping stream.", "error");
                }
            } else {
                handleStopStreaming();
            }
        }
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [stream]);


    const handlePinProduct = useCallback((product: Product) => {
        const newPinnedProduct = pinnedProduct?.name === product.name ? null : product;
        setPinnedProduct(newPinnedProduct);

        if (newPinnedProduct) {
             setChatMessages(prev => [...prev, {
                type: 'system',
                message: `${t('product_pinned_in_chat')}: ${product.name}`,
                productName: product.name,
            }]);
        }
    }, [pinnedProduct, t]);

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProductName.trim() && newProductPrice.trim()) {
            setProducts(prev => [...prev, { name: newProductName, price: newProductPrice }]);
            setNewProductName('');
            setNewProductPrice('');
        }
    };
    
    const handleSendChatMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && user) {
            const newMessage: LiveChatMessage = {
                type: 'host',
                author: user.name,
                avatar: business?.logoUrl || "https://i.imgur.com/8p8YJH8.png",
                message: chatInput,
            };
            setChatMessages(prev => [...prev, newMessage]);
            setChatInput('');
        }
    };
    
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <style>{`
                .input-field { width: 100%; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: var(--text-primary); transition: border-color 0.2s; }
                .btn-primary { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--primary-text); background-color: var(--primary); border-radius: 9999px; transition: opacity 0.3s; cursor: pointer; }
                .btn-primary:hover { opacity: 0.9; }
                .btn-danger { background-color: #EF4444; }
                .btn-danger:hover { opacity: 0.9; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column: Video Preview & Controls */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="relative w-full aspect-video bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden flex items-center justify-center">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                         {!isCameraOn && (
                            <div className="text-center text-[var(--text-secondary)]">
                                <VideoCameraSlashIcon className="w-16 h-16 mx-auto" />
                                <p className="mt-2 font-semibold">{t('camera_off')}</p>
                            </div>
                        )}
                        {isStreaming && (
                             <div className="absolute top-4 left-4 flex items-center gap-4 text-white text-sm">
                                <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full font-bold">
                                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span> LIVE
                                </div>
                                <div className="bg-black/50 px-3 py-1 rounded-full font-semibold">{formatTime(liveTime)}</div>
                                <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full font-semibold">
                                    <EyeIcon className="w-5 h-5"/> {viewerCount}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 space-y-4">
                         <input type="text" placeholder={t('stream_title')} value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} className="input-field text-lg" disabled={isStreaming} />
                         <div className="flex items-center justify-center gap-4">
                            <button onClick={() => toggleMediaDevice('camera')} className={`p-3 rounded-full transition-colors ${isCameraOn ? 'bg-[var(--primary)] text-[var(--primary-text)]' : 'bg-[var(--border-color)] text-[var(--text-primary)]'}`}>
                                {isCameraOn ? <VideoCameraIcon className="w-6 h-6" /> : <VideoCameraSlashIcon className="w-6 h-6" />}
                            </button>
                            <button onClick={() => toggleMediaDevice('mic')} className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-[var(--primary)] text-[var(--primary-text)]' : 'bg-[var(--border-color)] text-[var(--text-primary)]'}`}>
                                {isMicOn ? <MicrophoneIcon className="w-6 h-6" /> : <MicrophoneSlashIcon className="w-6 h-6" />}
                            </button>
                            <button onClick={isStreaming ? handleStopStreaming : handleStartStreaming} className={`w-full max-w-xs btn-primary ${isStreaming ? 'btn-danger' : ''}`}>
                                {isStreaming ? t('stop_streaming') : t('start_streaming')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Control Panel */}
                <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl flex flex-col h-[70vh]">
                    <div className="flex border-b border-[var(--border-color)]">
                        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--border-color-alt)]'}`}>{t('chat')}</button>
                        <button onClick={() => setActiveTab('products')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'products' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--border-color-alt)]'}`}>{t('featured_products')}</button>
                    </div>

                    {/* Chat Panel */}
                    <div className={`flex-1 flex flex-col p-4 overflow-y-auto hide-scrollbar ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
                         <div className="flex-1 space-y-4">
                            {!isStreaming && <p className="text-center text-sm text-[var(--text-muted)] pt-10">{t('start_streaming_to_see_chat')}</p>}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex items-start gap-2 ${msg.type === 'system' ? 'justify-center' : ''} ${msg.type === 'host' ? 'flex-row-reverse' : ''}`}>
                                    {msg.type !== 'system' && <img src={msg.avatar} alt={msg.author} className="w-8 h-8 rounded-full mt-1" />}
                                    <div className={`${msg.type === 'system' ? 'bg-[var(--primary)] text-[var(--primary-text)] text-xs font-bold px-3 py-1.5 rounded-full' : 'bg-[var(--background-alt)] p-2 rounded-lg'}`}>
                                        {msg.type !== 'system' && <p className={`font-bold text-sm ${msg.type === 'host' ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{msg.author}</p>}
                                        <p className={`text-sm ${msg.type === 'system' ? '' : 'text-[var(--text-secondary)]'}`}>{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                         </div>
                         <form onSubmit={handleSendChatMessage} className="mt-4 flex gap-2">
                             <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t('send_a_message')} className="input-field flex-1" disabled={!isStreaming} />
                             <button type="submit" className="btn-primary p-3" disabled={!isStreaming || !chatInput.trim()}>
                                <PaperAirplaneIcon className="w-5 h-5"/>
                             </button>
                         </form>
                    </div>
                    
                    {/* Products Panel */}
                     <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'products' ? 'flex' : 'hidden'}`}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
                            {pinnedProduct && (
                                <div className="border-2 border-[var(--primary)] rounded-lg p-3 bg-opacity-20 bg-[var(--primary)]">
                                    <p className="text-xs font-bold text-[var(--primary)] mb-1">{t('pinned_product')}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-[var(--text-primary)]">{pinnedProduct.name}</p>
                                        <p className="text-[var(--text-secondary)]">{pinnedProduct.price}</p>
                                    </div>
                                </div>
                            )}
                            {products.map((p, i) => (
                                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${pinnedProduct?.name === p.name ? 'bg-[var(--border-color-alt)]' : ''}`}>
                                    <TagIcon className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{p.price}</p>
                                    </div>
                                    <button onClick={() => handlePinProduct(p)} className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--primary)] disabled:opacity-50" disabled={!isStreaming}>
                                        {pinnedProduct?.name === p.name ? <VerifiedIcon className="w-5 h-5 text-[var(--primary)]"/> : <PinIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--background)]">
                             <form onSubmit={handleAddProduct} className="space-y-2">
                                <input 
                                    type="text" 
                                    value={newProductName} 
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    placeholder={t('product_name')} 
                                    className="input-field" 
                                    disabled={!isStreaming}
                                />
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newProductPrice} 
                                        onChange={(e) => setNewProductPrice(e.target.value)}
                                        placeholder={t('product_price')} 
                                        className="input-field flex-1" 
                                        disabled={!isStreaming}
                                    />
                                    <button type="submit" className="btn-primary" disabled={!isStreaming || !newProductName || !newProductPrice}>
                                        {t('add_product')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LiveStreamPage;

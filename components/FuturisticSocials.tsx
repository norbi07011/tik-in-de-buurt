import React from 'react';
import { InstagramIcon, TwitterIcon, GlobeAltIcon, FacebookIcon, LinkedinIcon, TikTokIcon } from './icons/Icons';

interface SocialsProps {
    socials: {
        instagram?: string;
        twitter?: string; // For X
        website?: string;
        facebook?: string;
        linkedin?: string;
        tiktok?: string;
    }
}

const SocialIcon: React.FC<{ social: string, url?: string }> = ({ social, url }) => {
    if (!url) return null;

    const icons: { [key: string]: React.ReactNode } = {
        instagram: <InstagramIcon className="w-5 h-5" />,
        twitter: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/></svg>,
        website: <GlobeAltIcon className="w-5 h-5" />,
        facebook: <FacebookIcon className="w-5 h-5" />,
        linkedin: <LinkedinIcon className="w-5 h-5" />,
        tiktok: <TikTokIcon className="w-5 h-5" />
    };

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-fuchsia-300 transition-colors transform hover:scale-110">
            {icons[social]}
        </a>
    )
}

const FuturisticSocials: React.FC<SocialsProps> = ({ socials }) => {
    // Filter out undefined links
    const availableSocials = Object.entries(socials).filter(([_, url]) => url);

    if (availableSocials.length === 0) {
        return null;
    }

    return (
        <div className="group relative w-20 h-24 lg:w-24 lg:h-28 flex items-center justify-center cursor-pointer
                        transition-all duration-500 ease-in-out
                        hover:w-28 hover:h-48 lg:hover:w-32 lg:hover:h-52
                        drop-shadow-[0_0_8px_rgba(255,0,255,0.4)] hover:drop-shadow-[0_0_20px_rgba(255,0,255,0.7)]">
            
            <div className="absolute inset-0 bg-black transition-all duration-500 ease-in-out futuristic-clip" />

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 flex flex-col items-center justify-start pt-6">
                <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-600 via-purple-800 to-black opacity-80 futuristic-clip"/>
                
                <h3 className="relative z-10 text-white font-bold text-sm lg:text-base tracking-widest uppercase">
                    SOCIALS
                </h3>
                <div className="relative z-10 flex flex-col items-center gap-3 mt-4">
                    {availableSocials.map(([key, url]) => (
                        <SocialIcon key={key} social={key} url={url as string} />
                    ))}
                </div>
            </div>
            
            <div className="absolute w-[6px] h-3/5 bg-fuchsia-500 bottom-[10%] rounded-full transition-all duration-500 ease-in-out group-hover:h-full group-hover:bottom-0">
                <div className="absolute inset-0 bg-fuchsia-400 blur-sm rounded-full"/>
            </div>

            <div className="absolute w-[6px] h-1/2 bg-fuchsia-500 top-[10%] origin-bottom transform -translate-x-[calc(50%+1px)] rotate-[-30deg] 
                         transition-transform duration-500 ease-in-out rounded-t-full
                         group-hover:rotate-[-50deg] group-hover:-translate-x-6 group-hover:-translate-y-2 group-hover:scale-y-125">
                <div className="absolute inset-0 bg-fuchsia-400 blur-sm rounded-t-full"/>
            </div>

             <div className="absolute w-[6px] h-1/2 bg-fuchsia-500 top-[10%] origin-bottom transform translate-x-[calc(50%+1px)] rotate-[30deg] 
                         transition-transform duration-500 ease-in-out rounded-t-full
                         group-hover:rotate-[50deg] group-hover:translate-x-6 group-hover:-translate-y-2 group-hover:scale-y-125">
                <div className="absolute inset-0 bg-fuchsia-400 blur-sm rounded-t-full"/>
            </div>
        </div>
    );
};

export default FuturisticSocials;

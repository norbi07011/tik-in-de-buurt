
import type React from 'react';

export const NlFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" {...props}>
    <path fill="#21468B" d="M0 0h9v6H0z" />
    <path fill="#FFF" d="M0 0h9v4H0z" />
    <path fill="#AE1C28" d="M0 0h9v2H0z" />
  </svg>
);

export const EnFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" {...props}>
    <clipPath id="a"><path d="M0 0v30h60V0z"/></clipPath>
    <clipPath id="b"><path d="M30 15h30v15H30zm-30 0h30v15H0zm0-15h30v15H0zm30 0h30v15H30z"/></clipPath>
    <g clipPath="url(#a)">
      <path d="M0 0v30h60V0z" fill="#012169"/>
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/>
      <path d="M0 0l60 30m0-30L0 30" clipPath="url(#b)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

export const TrFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20" {...props}>
    <path fill="#E30A17" d="M0 0h32v20H0z"/>
    <g fill="#FFF">
      <path d="M20.25 10a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"/>
      <path d="M21 10a6 6 0 11-12 0 6 6 0 0112 0zM19 10a4 4 0 10-8 0z"/>
      <path d="M20.8 11.53l-2.26-1.53 2.26-1.53.86 2.53-.86.53z"/>
    </g>
  </svg>
);

export const PlFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5" {...props}>
    <path fill="#fff" d="M0 0h8v5H0z"/>
    <path fill="#dc143c" d="M0 2.5h8V5H0z"/>
  </svg>
);

export const BgFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" {...props}>
    <path fill="#fff" d="M0 0h5v3H0z"/>
    <path fill="#00966E" d="M0 1h5v2H0z"/>
    <path fill="#D62612" d="M0 2h5v1H0z"/>
  </svg>
);

export const ArFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" {...props}>
    <path d="M0 0h900v600H0z"/>
    <path fill="#fff" d="M0 0h900v400H0z"/>
    <path fill="red" d="M0 0h900v200H0z"/>
    <path d="M0 0l300 300L0 600z" fill="#007A3D"/>
  </svg>
);

export const DeFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" {...props}>
    <path d="M0 0h5v3H0z"/>
    <path fill="#D00" d="M0 1h5v2H0z"/>
    <path fill="#FFCE00" d="M0 2h5v1H0z"/>
  </svg>
);

export const HuFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" {...props}>
    <path fill="#436F4D" d="M0 0h9v6H0z"/>
    <path fill="#FFF" d="M0 0h9v4H0z"/>
    <path fill="#CD2A3E" d="M0 0h9v2H0z"/>
  </svg>
);

export const FrFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" {...props}>
    <path fill="#fff" d="M0 0h900v600H0z"/>
    <path fill="#002395" d="M0 0h300v600H0z"/>
    <path fill="#ED2939" d="M600 0h300v600H600z"/>
  </svg>
);

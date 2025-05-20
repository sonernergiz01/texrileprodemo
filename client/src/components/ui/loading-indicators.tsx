import React from 'react';

interface LoadingIndicatorProps {
  width?: string;
  height?: string;
  color?: string;
}

// Dönen dairesel yüklenme göstergesi
export const Circle: React.FC<LoadingIndicatorProps> = ({
  width = "40",
  height = "40",
  color = "currentColor"
}) => {
  return (
    <div className="flex items-center justify-center">
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 38 38" 
        xmlns="http://www.w3.org/2000/svg"
        stroke={color}
      >
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)" strokeWidth="2">
            <circle strokeOpacity=".5" cx="18" cy="18" r="18"/>
            <path d="M36 18c0-9.94-8.06-18-18-18">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="1s"
                repeatCount="indefinite"/>
            </path>
          </g>
        </g>
      </svg>
    </div>
  );
};

// Üç nokta yüklenme göstergesi
export const ThreeDots: React.FC<LoadingIndicatorProps> = ({
  width = "50",
  height = "10",
  color = "currentColor"
}) => {
  return (
    <div className="flex items-center justify-center">
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 30"
        xmlns="http://www.w3.org/2000/svg"
        fill={color}
      >
        <circle cx="15" cy="15" r="15">
          <animate
            attributeName="r"
            from="15"
            to="15"
            begin="0s"
            dur="0.8s"
            values="15;9;15"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="fill-opacity"
            from="1"
            to="1"
            begin="0s"
            dur="0.8s"
            values="1;.5;1"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="60" cy="15" r="9" fillOpacity="0.3">
          <animate
            attributeName="r"
            from="9"
            to="9"
            begin="0s"
            dur="0.8s"
            values="9;15;9"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="fill-opacity"
            from="0.5"
            to="0.5"
            begin="0s"
            dur="0.8s"
            values=".5;1;.5"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="105" cy="15" r="15">
          <animate
            attributeName="r"
            from="15"
            to="15"
            begin="0s"
            dur="0.8s"
            values="15;9;15"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="fill-opacity"
            from="1"
            to="1"
            begin="0s"
            dur="0.8s"
            values="1;.5;1"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
};

// Yükleme çubukları
export const Bars: React.FC<LoadingIndicatorProps> = ({
  width = "40",
  height = "40",
  color = "currentColor"
}) => {
  return (
    <div className="flex items-center justify-center">
      <svg
        width={width}
        height={height}
        viewBox="0 0 135 140"
        xmlns="http://www.w3.org/2000/svg"
        fill={color}
      >
        <rect y="10" width="15" height="120" rx="6">
          <animate
            attributeName="height"
            begin="0.5s"
            dur="1s"
            values="120;110;100;90;80;70;60;50;40;140;120"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            begin="0.5s"
            dur="1s"
            values="10;15;20;25;30;35;40;45;50;0;10"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="30" y="10" width="15" height="120" rx="6">
          <animate
            attributeName="height"
            begin="0.25s"
            dur="1s"
            values="120;110;100;90;80;70;60;50;40;140;120"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            begin="0.25s"
            dur="1s"
            values="10;15;20;25;30;35;40;45;50;0;10"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="60" width="15" height="140" rx="6">
          <animate
            attributeName="height"
            begin="0s"
            dur="1s"
            values="120;110;100;90;80;70;60;50;40;140;120"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            begin="0s"
            dur="1s"
            values="10;15;20;25;30;35;40;45;50;0;10"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="90" y="10" width="15" height="120" rx="6">
          <animate
            attributeName="height"
            begin="0.25s"
            dur="1s"
            values="120;110;100;90;80;70;60;50;40;140;120"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            begin="0.25s"
            dur="1s"
            values="10;15;20;25;30;35;40;45;50;0;10"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="120" y="10" width="15" height="120" rx="6">
          <animate
            attributeName="height"
            begin="0.5s"
            dur="1s"
            values="120;110;100;90;80;70;60;50;40;140;120"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            begin="0.5s"
            dur="1s"
            values="10;15;20;25;30;35;40;45;50;0;10"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  );
};

// Yuvarlanarak giden çizgiler
export const RollingLines: React.FC<LoadingIndicatorProps> = ({
  width = "80",
  height = "80",
  color = "currentColor"
}) => {
  return (
    <div className="flex items-center justify-center">
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 38 38" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
            <stop stopColor={color} stopOpacity="0" offset="0%"/>
            <stop stopColor={color} stopOpacity=".631" offset="63.146%"/>
            <stop stopColor={color} offset="100%"/>
          </linearGradient>
        </defs>
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)">
            <path d="M36 18c0-9.94-8.06-18-18-18" strokeWidth="2" stroke="url(#a)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="0.9s"
                repeatCount="indefinite" />
            </path>
            <circle fill={color} cx="36" cy="18" r="1">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="0.9s"
                repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      </svg>
    </div>
  );
};

// Dalgalanan yüklenme göstergesi
export const Wave: React.FC<LoadingIndicatorProps> = ({
  width = "80",
  height = "40",
  color = "currentColor"
}) => {
  return (
    <div className="flex items-center justify-center">
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 50"
        xmlns="http://www.w3.org/2000/svg"
        fill={color}
      >
        <path
          d="M10 25c5 0 5 5 10 5s5-5 10-5 5 5 10 5 5-5 10-5 5 5 10 5 5-5 10-5 5 5 10 5 5-5 10-5"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <animate
            attributeName="d"
            values="
              M10 25c5 0 5 5 10 5s5-5 10-5 5 5 10 5 5-5 10-5 5 5 10 5 5-5 10-5 5 5 10 5 5-5 10-5;
              M10 35c5 0 5-5 10-5s5 5 10 5 5-5 10-5 5 5 10 5 5-5 10-5 5 5 10 5 5-5 10-5 5 5 10 5;
              M10 25c5 0 5 5 10 5s5-5 10-5 5 5 10 5 5-5 10-5 5 5 10 5 5-5 10-5 5 5 10 5 5-5 10-5"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  );
};

// Pulsating dots
export const Dots: React.FC<LoadingIndicatorProps> = ({
  width = "60",
  height = "15",
  color = "currentColor"
}) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className={`w-2 h-2 rounded-full bg-current animate-pulse`} style={{ color }}></div>
      <div className={`w-2 h-2 rounded-full bg-current animate-pulse`} style={{ animationDelay: "300ms", color }}></div>
      <div className={`w-2 h-2 rounded-full bg-current animate-pulse`} style={{ animationDelay: "600ms", color }}></div>
    </div>
  );
};
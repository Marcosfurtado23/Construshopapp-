import React, { useState, useEffect } from 'react';

interface TractorButtonProps {
  onClick: () => void;
}

export const TractorButton: React.FC<TractorButtonProps> = ({ onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTractor, setIsTractor] = useState(false);
  const [isDriving, setIsDriving] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsTractor(true);
    
    // Call the actual onClick handler
    onClick();

    setTimeout(() => {
      setIsDriving(true);
    }, 800);

    setTimeout(() => {
      setIsTractor(false);
      setIsDriving(false);
      setIsAnimating(false);
    }, 4000);
  };

  return (
    <div className="relative w-[100px] h-[36px] flex justify-center items-center">
      <style dangerouslySetInnerHTML={{__html: `
        .tractor-btn {
            --cor-fundo: transparent;
            --cor-primaria: #2A85FF;
            --cor-secundaria: #1e6ce0;
            --cor-texto: #FFFFFF;
            --cor-sucesso: #10B981;
            --cor-janela: #ffffff;
            --curva-suave: cubic-bezier(0.85, 0, 0.15, 1);
            --curva-salto: cubic-bezier(0.34, 1.56, 0.64, 1);
            cursor: pointer;
            overflow: visible;
            -webkit-tap-highlight-color: transparent;
            position: absolute;
            width: 250px;
            height: 125px;
            pointer-events: none; /* Let clicks pass through empty space */
        }
        
        .tractor-btn * {
            pointer-events: auto; /* Re-enable clicks on visible parts */
        }

        .tractor-btn #chassi {
            transition: all 0.6s var(--curva-suave);
        }

        .tractor-btn #btn-conteudo {
            transition: opacity 0.3s ease, transform 0.4s var(--curva-suave);
            transform-origin: center;
        }

        .tractor-btn:not(.is-tractor):hover #chassi {
            transform: translateY(-2px);
            fill: var(--cor-secundaria);
        }

        .tractor-btn .peca-trator {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            transform-origin: center;
            transition: all 0.5s var(--curva-salto);
        }

        .tractor-btn #cabina { transform-origin: 170px 90px; }
        .tractor-btn #escape { transform-origin: 235px 90px; }
        .tractor-btn .roda { transform-origin: center; transform-box: fill-box; }

        .tractor-btn.is-tractor #btn-conteudo {
            opacity: 0;
            transform: scale(0.8);
        }

        .tractor-btn.is-tractor #chassi {
            x: 150px;
            y: 90px;
            width: 100px;
            height: 24px;
            rx: 6px;
        }

        .tractor-btn.is-tractor .peca-trator {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .tractor-btn.is-tractor #cabina { transition-delay: 0.1s; }
        .tractor-btn.is-tractor #escape { transition-delay: 0.15s; }
        .tractor-btn.is-tractor .roda.tras { transition-delay: 0.2s; }
        .tractor-btn.is-tractor .roda.frente { transition-delay: 0.25s; }

        .tractor-btn.is-tractor.driving #grupo-movimento {
            animation: driveRight 2s var(--curva-suave) forwards;
        }

        .tractor-btn.is-tractor.driving .roda-giratoria {
            transform-origin: center;
            transform-box: fill-box;
            animation: spin 0.8s linear infinite;
        }

        @keyframes driveRight {
            0% { transform: translateX(0); }
            15% { transform: translateX(-8px); }
            100% { transform: translateX(600px); }
        }

        @keyframes spin {
            100% { transform: rotate(360deg); }
        }

        .tractor-btn .fumo {
            opacity: 0;
            stroke-linecap: round;
            transform-origin: center;
            transform-box: fill-box;
        }

        .tractor-btn.is-tractor.driving .fumo {
            animation: puff 0.8s infinite ease-out;
        }
        .tractor-btn.is-tractor.driving .fumo-2 { animation-delay: 0.4s; }

        @keyframes puff {
            0% { opacity: 0; transform: translateY(0) scale(0.5); stroke-width: 4px; }
            50% { opacity: 0.5; stroke-width: 2px; }
            100% { opacity: 0; transform: translateY(-30px) scale(1.5); stroke-width: 0px; }
        }

        .tractor-btn #texto-sucesso {
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.6s var(--curva-suave);
            pointer-events: none;
        }

        .tractor-btn.is-tractor.driving ~ #texto-sucesso,
        .tractor-btn.is-tractor.driving #texto-sucesso {
            opacity: 1;
            transform: translateY(0);
            transition-delay: 1s;
        }
      `}} />
      <svg 
        className={`tractor-btn ${isTractor ? 'is-tractor' : ''} ${isDriving ? 'driving' : ''} ${isAnimating ? 'opacity-100' : 'opacity-100 transition-opacity duration-300'}`} 
        viewBox="0 0 400 200" 
        onClick={handleClick}
        style={{ opacity: isAnimating && !isTractor && !isDriving ? 0 : 1 }}
      >
          {/* Texto de Sucesso ao centro */}
          <g id="texto-sucesso">
              <circle cx="200" cy="85" r="20" fill="var(--cor-sucesso)" />
              <path d="M 192 86 l 5 5 l 10 -10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <text x="200" y="130" textAnchor="middle" fill="var(--cor-primaria)" fontSize="20" fontWeight="700" letterSpacing="-0.5px">
                  Adicionado
              </text>
          </g>

          {/* Grupo Principal do Trator */}
          <g id="grupo-movimento">
              
              {/* Fumo do Escape (Minimalista) */}
              <g id="grupo-fumo">
                  <line className="fumo fumo-1" x1="235" y1="55" x2="235" y2="45" stroke="var(--cor-secundaria)" />
                  <line className="fumo fumo-2" x1="235" y1="50" x2="235" y2="40" stroke="var(--cor-secundaria)" />
              </g>

              {/* Cabina (Linhas puras geométricas) */}
              <g id="cabina" className="peca-trator">
                  {/* Estrutura */}
                  <path d="M 155 90 L 155 60 Q 155 55 160 55 L 185 55 Q 190 55 190 60 L 190 90 Z" fill="var(--cor-primaria)" />
                  {/* Recorte da Janela */}
                  <rect x="162" y="62" width="22" height="16" rx="3" fill="var(--cor-janela)" />
              </g>

              {/* Tubo de Escape (Linha simples) */}
              <rect id="escape" className="peca-trator" x="233" y="65" width="4" height="25" rx="2" fill="var(--cor-primaria)" />

              {/* O Botão Principal (Transforma-se no Chassi) */}
              <rect id="chassi" x="120" y="75" width="160" height="50" rx="25" fill="var(--cor-primaria)" />

              {/* Conteúdo do Botão */}
              <g id="btn-conteudo">
                  {/* Ícone + Minimalista */}
                  <path d="M 140 100 h 12 m -6 -6 v 12" fill="none" stroke="var(--cor-texto)" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Texto */}
                  <text x="160" y="106" fill="var(--cor-texto)" fontSize="20" fontWeight="600" letterSpacing="0.5px">Adicionar</text>
              </g>

              {/* Rodas (Geometria plana perfeita) */}
              <g id="rodas">
                  {/* Roda Traseira (Maior, à esquerda) */}
                  <g className="peca-trator roda tras">
                      <g className="roda-giratoria">
                          <circle cx="165" cy="110" r="18" fill="var(--cor-primaria)" />
                          {/* Detalhe interior para mostrar rotação */}
                          <circle cx="165" cy="110" r="8" fill="var(--cor-fundo)" />
                          <circle cx="165" cy="110" r="3" fill="var(--cor-primaria)" />
                          <line x1="165" y1="92" x2="165" y2="128" stroke="var(--cor-fundo)" strokeWidth="2" />
                          <line x1="147" y1="110" x2="183" y2="110" stroke="var(--cor-fundo)" strokeWidth="2" />
                      </g>
                  </g>

                  {/* Roda Frontal (Menor, à direita) */}
                  <g className="peca-trator roda frente">
                      <g className="roda-giratoria">
                          <circle cx="230" cy="114" r="14" fill="var(--cor-primaria)" />
                          {/* Detalhe interior para mostrar rotação */}
                          <circle cx="230" cy="114" r="6" fill="var(--cor-fundo)" />
                          <circle cx="230" cy="114" r="2" fill="var(--cor-primaria)" />
                          <line x1="230" y1="100" x2="230" y2="128" stroke="var(--cor-fundo)" strokeWidth="1.5" />
                          <line x1="216" y1="114" x2="244" y2="114" stroke="var(--cor-fundo)" strokeWidth="1.5" />
                      </g>
                  </g>
              </g>
          </g>
      </svg>
    </div>
  );
};

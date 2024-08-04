import React, { useEffect, useMemo } from 'react';
import Particles from "@tsparticles/react";
import { initParticlesEngine } from "@tsparticles/react";
import { ISourceOptions, MoveDirection, OutMode } from "@tsparticles/engine";
import { useThemeColorContext } from '../../contexts/ThemeColorContext';
import { loadSlim } from '@tsparticles/slim';

const ParticlesBackground: React.FC = () => {
    const { color } = useThemeColorContext();

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);    
        });
    }, []);

    const options: ISourceOptions = useMemo(() => ({
        pauseOnBlur: true,
        background: {
            color: {
                value: "transparent",
            },
        },
        particles: {
            number: {
                value: 200,
                density: {
                    enable: true,
                    area: 100,
                },
            },
            color: {
                value: color,
            },
            links: {
                enable: true,
                distance: 180,
                color: color,
                opacity: 0.2,
                width: 1,
            },
            move: {
                enable: true,
                speed: 1,
                direction: MoveDirection.none,
                outMode: OutMode.bounce,
            },
            size: {
                value: { min: 1, max: 7 },
            },
            opacity: {
                value: 0.3,
            },
        },
        detectRetina: false,
    }), [color]);

    return (
        <Particles
            id="tsparticles"
            options={options}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1, // Ensure particles are behind other content
            }}
        />
    );
};

export default ParticlesBackground;

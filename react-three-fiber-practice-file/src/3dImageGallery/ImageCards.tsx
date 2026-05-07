import { ScrollControls, useScroll, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useState } from 'react';
import { DoubleSide, Group, Mesh, Vector3, MathUtils } from 'three';

const ImageCards = () => {
    const groupRef = React.useRef<Group>(null!);
    const meshRefs = React.useRef<(Mesh | null)[]>([]);
    const columns = 3;
    const spacing = { x: 5.2, y: 5.6 };
    const initialGroupPos = new Vector3(-5.25, 1, 0);
    
    // State to track which card is selected (null = no selection)
    const [selected, setSelected] = useState<number | null>(null);

    const imageUrls = new Array(20).fill(null).map((_, i) => 
        `https://randomuser.me/api/portraits/men/${(i % 70) + 1}.jpg`
    );

    const textures = useTexture(imageUrls)

    const scroll = useScroll()

    useFrame(() => {
        if (!groupRef.current || !scroll) return

        // Calculate target position for the group
        const target = new Vector3();
        
        if (selected === null) {
            // No card selected: use normal scroll behavior
            target.x = initialGroupPos.x;
            target.y = scroll.offset * 20;
            target.z = initialGroupPos.z;
        } else {
            // Card is selected: center it on screen
            const col = selected % columns;
            const row = Math.floor(selected / columns);
            const cardLocalX = col * spacing.x;
            const cardLocalY = -row * spacing.y;
            
            // Move group so selected card is at world (0, 0)
            target.x = -cardLocalX;
            target.y = -cardLocalY;
            target.z = initialGroupPos.z;
        }

        // Smooth animation: move group towards target position
        groupRef.current.position.lerp(target, 0.12);

        // Animate individual cards
        meshRefs.current.forEach((mesh, index) => {
            if (!mesh) return;

            // If this is the selected card, move it forward (closer to camera)
            const targetZ = index === selected ? 2.5 : 0;
            mesh.position.z = MathUtils.lerp(mesh.position.z, targetZ, 0.12);

            // If this is the selected card, make it slightly bigger
            const targetScale = index === selected ? 1.1 : 1;
            mesh.scale.x = MathUtils.lerp(mesh.scale.x, targetScale, 0.12);
            mesh.scale.y = MathUtils.lerp(mesh.scale.y, targetScale, 0.12);
        });
    })

    return (
        <group position={[initialGroupPos.x, initialGroupPos.y, initialGroupPos.z]} ref={groupRef}>
            {
                new Array(20).fill(null).map((item, index) => {
                    const col = index % columns
                    const row = Math.floor(index / columns)

                    return (
                        <mesh 
                            key={index}
                            ref={(el) => {
                                meshRefs.current[index] = el;
                            }}
                            position={[
                                col * spacing.x,   
                                -row * spacing.y, 
                                0
                            ]}
                            onClick={(e) => {
                                e.stopPropagation()
                                // Toggle selection: click to select, click again to deselect
                                setSelected((s) => (s === index ? null : index))
                            }}
                        >
                            <boxGeometry args={[4.4, 5, 0.1]} />
                            <meshStandardMaterial map={textures[index]} side={DoubleSide}/>
                        </mesh>
                    )
                })
            }
        </group>
    )
}

export default ImageCards
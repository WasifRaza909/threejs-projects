"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { GUI } from 'lil-gui'
import { Color } from 'three'

function Room(props) {
  const group = useRef()
  const { nodes, materials, animations } = useGLTF('/3d-assets/gaming_room_desktop_setup.glb')
  const { actions } = useAnimations(animations, group)

  const newColor = new Color(0xffffff);
  useEffect(() => {
  },[])

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
          <group name="258f02bf2699460eb04e7d3cd716bfcefbx" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
            <group name="Object_2">
              <group name="RootNode">
                <group name="SPEAKER" position={[-75.007, 94.928, -109.642]} rotation={[0, 0, Math.PI / 2]} scale={20.407}>
                  <mesh name="SPEAKER_DefaultMaterial_0" geometry={nodes.SPEAKER_DefaultMaterial_0.geometry} material={materials.DefaultMaterial} />
                </group>
                <group name="SPEAKER001" position={[72.515, 94.928, -109.642]} rotation={[0, 0, Math.PI / 2]} scale={20.407}>
                  <mesh name="SPEAKER001_DefaultMaterial_0" geometry={nodes.SPEAKER001_DefaultMaterial_0.geometry} material={materials.DefaultMaterial} />
                </group>
                <group name="BEAN_BAG001" position={[-16.184, 0, 19.572]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                  <mesh name="BEAN_BAG001_Goi_0" geometry={nodes.BEAN_BAG001_Goi_0.geometry} material={materials.material} />
                </group>
                <group name="BUILDING" position={[0, 2.532, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                  <mesh name="BUILDING_lambert1_0" geometry={nodes.BUILDING_lambert1_0.geometry} material={materials.lambert1} />
                  <mesh name="BUILDING_GLASS_0" geometry={nodes.BUILDING_GLASS_0.geometry} material={materials.GLASS} />
                </group>
                <group name="JENDELA" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                  <mesh name="JENDELA__0" geometry={nodes.JENDELA__0.geometry} material={materials.JENDELA__0} />
                </group>
                <group name="Sun004" position={[-18.365, 309.845, 172.94]} rotation={[1.316, -1.525, 0.192]} scale={[2127.345, 2116.451, 3290.533]}>
                  <group name="Object_12" rotation={[Math.PI / 2, 0, 0]}>
                    <group name="Object_13" />
                  </group>
                </group>
                <group name="Sun002" position={[323.892, 309.845, -94.507]} rotation={[1.316, -1.525, 0.192]} scale={[2127.345, 2116.451, 3290.533]}>
                  <group name="Object_15" rotation={[Math.PI / 2, 0, 0]}>
                    <group name="Object_16" />
                  </group>
                </group>
                <group name="Sun003" position={[-103.856, 201.842, 21.406]} rotation={[2.715, -1.559, 2.723]} scale={[45.824, 22.765, 35.39]}>
                  <group name="Object_18" rotation={[Math.PI / 2, 0, 0]}>
                    <group name="Object_19" />
                  </group>
                </group>
                <group name="MEJA" position={[-25.3, 0, 35.358]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                  <mesh name="MEJA_PUTIH_0" geometry={nodes.MEJA_PUTIH_0.geometry} material={materials.PUTIH} />
                  <mesh name="MEJA_LED_0" geometry={nodes.MEJA_LED_0.geometry} material={materials.material_5} />
                </group>
                <group name="MONITOR" position={[-2.12, 130.676, -124.299]} rotation={[-1.585, 0.001, 0.004]} scale={8.785}>
                  <mesh name="MONITOR_Monitor_Frame_0" geometry={nodes.MONITOR_Monitor_Frame_0.geometry} material={materials.Monitor_Frame} />
                </group>
                <group name="MOUSE" position={[46.911, 97.108, -83.116]} rotation={[-Math.PI / 2, 0, 0]} scale={6.251}>
                  <mesh name="MOUSE_PC_kasa_0" geometry={nodes.MOUSE_PC_kasa_0.geometry} material={materials.PC_kasa} />
                  <mesh name="MOUSE_LED_KEYBOARD_0" geometry={nodes.MOUSE_LED_KEYBOARD_0.geometry} material={materials.LED_KEYBOARD} />
                </group>
                <group name="KABEL" position={[-38.053, 91.356, -142.327]} rotation={[-Math.PI / 2, 0, 0]} scale={6.832}>
                  <mesh name="KABEL_CableColor_0" geometry={nodes.KABEL_CableColor_0.geometry} material={materials.CableColor} />
                </group>
                <group name="KEYBOARD" position={[-4.25, 97.39, -82.616]} rotation={[-Math.PI / 2, 0, 0]} scale={6.251}>
                  <mesh name="KEYBOARD_Keyboard_Keys_0" geometry={nodes.KEYBOARD_Keyboard_Keys_0.geometry} material={materials.Keyboard_Keys} />
                </group>
                <group name="PC_CASE" position={[-88.425, 25.778, -103.72]} rotation={[Math.PI, 0, 0]} scale={6.832}>
                  <mesh name="PC_CASE_CableColor_0" geometry={nodes.PC_CASE_CableColor_0.geometry} material={materials.CableColor} />
                  <mesh name="PC_CASE_CableColor_0_1" geometry={nodes.PC_CASE_CableColor_0_1.geometry} material={materials.CableColor} />
                </group>
                <group name="GAMING_CHAIR" position={[61.302, 81.729, -15.395]} rotation={[0, -0.615, 0]} scale={4.674}>
                  <mesh name="GAMING_CHAIR_GAMING_CHAIR_0" geometry={nodes.GAMING_CHAIR_GAMING_CHAIR_0.geometry} material={materials.GAMING_CHAIR} />
                </group>
                <group name="LAMP" position={[-26.002, 0, 35.358]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                  <group name="Sun005" position={[-1.039, 1.535, 2.018]} rotation={[-1.997, -1.559, 2.723]} scale={[0.458, 0.228, 0.354]}>
                    <group name="Object_41" rotation={[Math.PI / 2, 0, 0]}>
                      <group name="Object_42" />
                    </group>
                  </group>
                  <mesh name="LAMP_lambert1_0" geometry={nodes.LAMP_lambert1_0.geometry} material={materials.lambert1} />
                  <mesh name="LAMP_lambert5_0" geometry={nodes.LAMP_lambert5_0.geometry} material={materials.lambert5} />
                </group>
                <group name="Plane" position={[-25.3, 0, 35.358]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                  <mesh name="Plane_PUTIH_0" geometry={nodes.Plane_PUTIH_0.geometry} material={materials.PUTIH} />
                  <mesh name="Plane_LED_KEYBOARD_0" geometry={nodes.Plane_LED_KEYBOARD_0.geometry} material={materials.LED_KEYBOARD} />
                </group>
                <group name="POSTER_1" position={[-78.36, 227.232, -152.87]} scale={[27.034, 35.07, 53.83]}>
                  <mesh name="POSTER_1_Side_Frame_0" geometry={nodes.POSTER_1_Side_Frame_0.geometry} material={materials.Side_Frame} />
                  <mesh name="POSTER_1_POSTER_1_0" geometry={nodes.POSTER_1_POSTER_1_0.geometry} material={materials.POSTER_1} />
                </group>
                <group name="POSTER_2" position={[-0.972, 227.232, -152.87]} scale={[27.034, 35.07, 53.83]}>
                  <mesh name="POSTER_2_Side_Frame_0" geometry={nodes.POSTER_2_Side_Frame_0.geometry} material={materials.Side_Frame} />
                  <mesh name="POSTER_2_POSTER_2_0" geometry={nodes.POSTER_2_POSTER_2_0.geometry} material={materials.POSTER_2} />
                </group>
                <group name="POSTER_3" position={[76.424, 227.232, -152.87]} scale={[27.034, 35.07, 53.83]}>
                  <mesh name="POSTER_3_Side_Frame_0" geometry={nodes.POSTER_3_Side_Frame_0.geometry} material={materials.Side_Frame} />
                  <mesh name="POSTER_3_POSTER_3_0" geometry={nodes.POSTER_3_POSTER_3_0.geometry} material={materials.POSTER_3} />
                </group>
                <group name="Camera" position={[7.469, 122.386, 541.907]} rotation={[3.141, 1.48, 3.121]} scale={100}>
                  <group name="Object_60" />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
export default Room;

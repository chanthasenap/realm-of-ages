import React, { useState } from 'react'
import { CRESTS, UNIT_ART } from '../data/factions.js'
import { ITEM_ART, RARITY_COLOR } from '../data/items.js'

/**
 * Faction crest image.
 * Tries /images/factions/<factionId>.jpg first.
 * Falls back to the inline SVG crest on load error.
 */
export function FactionImage({ factionId, size = 52, style = {} }) {
  const [failed, setFailed] = useState(false)

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.15),
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  }

  if (!failed) {
    return (
      <div style={containerStyle}>
        <img
          src={`/images/factions/${factionId}.jpg`}
          alt={factionId}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>
    )
  }

  return (
    <div
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: CRESTS[factionId] || '' }}
    />
  )
}

/**
 * Unit portrait image.
 * Tries /images/units/<unitId>.jpg first.
 * Falls back to the inline SVG art on load error.
 */
export function UnitPortrait({ unitId, artType, factionColor, size = 52 }) {
  const [failed, setFailed] = useState(false)

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.15),
    overflow: 'hidden',
    flexShrink: 0,
    border: `1px solid ${factionColor}44`,
  }

  if (!failed) {
    return (
      <div style={containerStyle}>
        <img
          src={`/images/units/${unitId}.jpg`}
          alt={unitId}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>
    )
  }

  const svgHtml = UNIT_ART[artType]?.(factionColor, '#111') || ''
  return (
    <div
      style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  )
}

export function ItemArt({ artType, rarity, size = 120 }) {
  const accent = RARITY_COLOR[rarity] || '#9090a8'
  const svgHtml = ITEM_ART[artType]?.(accent) || ITEM_ART.rune(accent)
  return (
    <div
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  )
}

export function ResourceBuildingImg({ isGold, accent, size = 44 }) {
  const [failed, setFailed] = useState(false)
  const src = isGold ? '/images/buildings/gold_resource.jpg' : '/images/buildings/mana_resource.jpg'
  const style = {
    width: size, height: size,
    borderRadius: Math.round(size * 0.15),
    objectFit: 'cover',
    border: `1px solid ${accent}44`,
  }
  if (failed) {
    const color = isGold ? '#c9a84c' : '#a89cf0'
    const icon  = isGold ? '◈' : '✦'
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55, color }}>
        {icon}
      </div>
    )
  }
  return <img src={src} alt={isGold ? 'gold' : 'mana'} style={style} onError={() => setFailed(true)} />
}

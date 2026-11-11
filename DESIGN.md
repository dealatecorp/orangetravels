---
name: CargoOS
description: Navy and blue design system for the CargoOS operations website.
colors:
  blue: "#356ae6"
  blue-hover: "#2759ce"
  link: "#2455c3"
  blue-soft: "#eaf1ff"
  navy: "#14243a"
  deep: "#0d1828"
  nav-hover: "#223754"
  nav-selected: "#284572"
  nav-text: "#c5d2e5"
  nav-selected-text: "#f7faff"
  background: "#f5f7fa"
  surface: "#fff"
  text: "#172337"
  muted: "#59687d"
  control-text: "#34445c"
  border: "#e2e8f0"
  status-slate: "#8297bf"
  status-amber: "#e3a53d"
  status-green: "#36a581"
  status-red: "#d66464"
  badge-neutral: "#edf1f6"
  badge-neutral-text: "#526278"
  badge-slate: "#ecf1f9"
  badge-slate-text: "#455f89"
  badge-amber: "#fff4df"
  badge-amber-text: "#8d5609"
  badge-green: "#e7f6ee"
  success: "#137850"
  badge-red: "#fff0f0"
  badge-red-text: "#ad333b"
  danger: "#b53338"
typography:
  headline:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: "clamp(24px, 2.05vw, 31px)"
    fontWeight: 720
    lineHeight: 1.18
    letterSpacing: "-0.037em"
  metric:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: "clamp(23px, 2vw, 29px)"
    fontWeight: 720
    lineHeight: 1.18
    letterSpacing: "-0.036em"
  title:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 680
    lineHeight: 1.4
    letterSpacing: "-0.018em"
  body:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
  field-label:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 620
  label:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 620
    lineHeight: 1.4
rounded:
  badge: "5px"
  navigation: "6px"
  control: "7px"
  popover: "9px"
  panel: "11px"
  dialog: "13px"
spacing:
  control-gap: "8px"
  field-gap: "14px"
  dashboard-gap: "15px"
  section-gap: "16px"
  workspace-inset: "26px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "7px 13px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.control-text}"
    rounded: "{rounded.control}"
    padding: "7px 13px"
  button-icon:
    rounded: "{rounded.control}"
    size: "36px"
  button-text:
    textColor: "{colors.link}"
    padding: "0"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 10px"
  nav-item:
    textColor: "{colors.nav-text}"
    rounded: "{rounded.navigation}"
    padding: "6px 10px"
  nav-item-selected:
    backgroundColor: "{colors.nav-selected}"
    textColor: "{colors.nav-selected-text}"
  badge:
    backgroundColor: "{colors.badge-neutral}"
    textColor: "{colors.badge-neutral-text}"
    typography: "{typography.label}"
    rounded: "{rounded.badge}"
    padding: "4px 8px"
  badge-slate:
    backgroundColor: "{colors.badge-slate}"
    textColor: "{colors.badge-slate-text}"
  badge-blue:
    backgroundColor: "{colors.blue-soft}"
    textColor: "{colors.link}"
  badge-amber:
    backgroundColor: "{colors.badge-amber}"
    textColor: "{colors.badge-amber-text}"
  badge-green:
    backgroundColor: "{colors.badge-green}"
    textColor: "{colors.success}"
  badge-red:
    backgroundColor: "{colors.badge-red}"
    textColor: "{colors.badge-red-text}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  metric-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "13px 15px 12px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.dialog}"
    padding: "20px"
---

# Design System: CargoOS

## Overview

**Creative North Star: "Cargo operations workspace"**

A deep navy rail frames a cool, light workspace. White panels and fine dividers keep dense shipment lists, metrics and forms easy to scan. Inter ties together navigation, record identifiers and figures.

Blue marks primary actions, links and focus. Shipment status colors carry the same meaning from dashboard totals to register badges and shipment history.

**Key Characteristics**

- Deep navy navigation and a cool workspace
- Inter with tabular figures for operational data
- Flat, bordered panels and labeled status colors

## Colors

### Primary

Blue fills primary actions and marks keyboard focus. Link blue identifies navigable record references and text actions. Pale blue tints selected or hovered controls on the light workspace.

### Secondary

Status tones carry across visualizations and badge labels. Slate marks booked and allocated shipments, blue marks in-transit shipments, amber marks arrived, received and out-for-delivery shipments, green marks delivered shipments, red marks cancelled shipments, and neutral marks drafts. Badges use darker text on pale tints so the status remains readable at small sizes.

**The Status Color Rule.** Use the shipment status mapping consistently in chart segments, legend swatches, badges and milestone markers. Pair the color with a status label.

### Neutral

Navy anchors navigation, with lighter blue-gray rows for hover and selection. A white surface and a fine border define each panel against the cool background. Dark ink carries records and figures. Muted text carries supporting detail.

## Typography

Inter Variable serves every UI role, with Inter and sans-serif fallbacks. Compact, tightly tracked headings identify pages and panels. Metric values use the page-heading weight with tabular figures. Form labels and table entries use the compact text scale. Status badges and table headers use the smallest text roles.

**The Tabular Figures Rule.** Use tabular numerals for LR links, metric values, chart counts and numeric table cells. Align numeric table cells to the right.

## Layout

The desktop shell pairs a sticky 232px navigation rail with a sticky 64px top bar. Collapsing the rail reduces it to 68px. Dashboard metrics use four equal columns, followed by a wider trend chart and a narrower status panel. Forms and detail views use a main work area alongside a narrower summary where space permits.

At 1180px and below, the expanded rail narrows to 205px and gutters tighten. At 980px the breadcrumb clears space for toolbar controls and party fields stack. At 800px the rail opens as a drawer over a scrim. At 600px the toolbar drops to 56px, metrics reflow to two columns, charts and detail sections stack, and the dashboard register displays a reduced set of columns. Full registers can scroll horizontally.

## Elevation & Depth

Panels rely on their borders and tonal separation. Popovers, dialogs and toasts use diffuse shadows. A translucent navy scrim isolates a modal or an open mobile drawer.

## Shapes

Badges and navigation rows use tighter corners than controls. Panels have a gentler radius, and dialogs use the largest radius. Small circular markers indicate status, and circular avatars identify the signed-in account. Lucide line icons accompany actions, navigation and metrics.

## Components

- **Buttons.** Primary actions use blue with white text and darken on hover. Secondary buttons use white with a fine cool border and a tinted hover. Standard buttons are at least 38px high. Compact variants are at least 32px high. Icon buttons are 36px square, and text buttons underline on hover.
- **Fields and search.** Standard fields use visible labels above white controls, with a 37px minimum height. Disabled and calculated values sit on a muted fill. Search places an icon inside the field boundary and changes that boundary to blue on focus. Standalone interactive elements use a 2px blue focus outline with a 3px offset.
- **Navigation.** Grouped icon-and-label rows fill the navy rail. A muted blue fill marks the selected destination. In-page tabs use link blue and a blue underline to mark the current section.
- **Status badges.** A short label and a dot in the text color sit on a pale status tint. The compact badge keeps its text on one line.
- **Panels and metric cards.** White bordered panels frame charts, forms and registers. Metric cards use tinted icon tiles, a short label, a tabular value and supporting context. Their border changes on hover. Register headers use a light tinted row with subtle horizontal dividers.
- **Status breakdown.** A donut centers the total. Its adjacent legend pairs each color swatch with a label and tabular count. Each legend row opens the matching shipment queue.
- **Motion.** Buttons transition background and border colors over 160ms. Metric cards transition their border over 150ms. Reduced-motion preferences shorten transitions and animations.

## Do's and Don'ts

- Do use Inter and keep operational figures aligned with tabular numerals.
- Do pair each status color with readable text and keep its meaning consistent across views.
- Do preserve the blue keyboard focus treatment on interactive controls.
- Do use white bordered panels for work areas and reserve shadows for floating UI.

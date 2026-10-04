/**
 * Plataforma d'Apps Enxufables · la llista tancada d'icones.
 *
 * Un manifest només nomena icones (NOMS_ICONES, manifestApp.js); ací es
 * resolen als components de lucide-react. Cap SVG ni HTML ve d'una app.
 * manifestApp.test.js comprova que les claus d'ací i la llista del manifest
 * són exactament les mateixes.
 */
import {
  Activity, AppWindow, BookOpen, Boxes, Building2, Calculator, CalendarDays, ChartColumn, ChefHat, ClipboardList, Coffee, Contact,
  CupSoda, Droplet, FileSpreadsheet, FileText, HeartHandshake, HeartPulse, Inbox, Landmark, LayoutDashboard, LayoutGrid, NotebookPen,
  Package, Percent, Phone, Pill, Puzzle, Receipt, ScanLine, Settings, ShoppingCart, Stethoscope, Store, Users, Utensils, Wrench
} from 'lucide-react';

export const ICONES_APP = Object.freeze({
  Activity, AppWindow, BookOpen, Boxes, Building2, Calculator, CalendarDays, ChartColumn, ChefHat, ClipboardList, Coffee, Contact,
  CupSoda, Droplet, FileSpreadsheet, FileText, HeartHandshake, HeartPulse, Inbox, Landmark, LayoutDashboard, LayoutGrid, NotebookPen,
  Package, Percent, Phone, Pill, Puzzle, Receipt, ScanLine, Settings, ShoppingCart, Stethoscope, Store, Users, Utensils, Wrench
});

/** El component d'una icona de la llista; AppWindow si el nom no hi és. */
export function iconaDe(nom) {
  return Object.hasOwn(ICONES_APP, nom) ? ICONES_APP[nom] : AppWindow;
}

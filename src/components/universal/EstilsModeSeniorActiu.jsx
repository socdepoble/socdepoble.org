import { useRef } from 'react';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssModeSenior from '../../css/diferit-mode-senior.css?inline';

export default function EstilsModeSeniorActiu({ arrelRef }) {
  const localRef = useRef(null);
  useFullDiferit(arrelRef || localRef, 'mode-senior', cssModeSenior);
  return arrelRef ? null : <span ref={localRef} hidden />;
}

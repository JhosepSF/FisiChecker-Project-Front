import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // ✅ ADD
import "../../styles/Panel.css";

function useTheme() {
  const getSystem = () =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [theme, setTheme] = React.useState(() => localStorage.getItem("theme") || getSystem());

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

export function ColabAnalysisPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ ADD
  const { theme, toggle } = useTheme();
  const [copied, setCopied] = useState(false);

  const colabCode = `
  #!/usr/bin/env python3
  """
  Analisis de Accesibilidad Web
  Formula de Hilera - EXCLUYENDO NA del denominador.

  CAMBIOS RESPECTO AL SCRIPT ANTERIOR:
  - Hoja 1: "Resumen"
  - Hoja 2: "Criterios WCAG"
  - Columna banco:      "título"
  - Columna razon:      "título" (fallback)
  - Columna criterio:   "criterio"
  - Columna veredicto:  "veredicto"
  - Columna nivel:      "nivel"
  - Columna principio:  "principio"
  - Columna audit_id:   "auditoría id"
  """

  # =========================
  # SETUP BASE
  # =========================
  from google.colab import drive

  # Montar Google Drive
  drive.mount('/content/drive')

  !pip install -q pandas openpyxl matplotlib seaborn xlsxwriter

  import pandas as pd
  import numpy as np
  import matplotlib.pyplot as plt
  import seaborn as sns
  from pathlib import Path
  from urllib.parse import urlparse
  from collections import Counter

  # Configuracion de estilo
  plt.style.use('seaborn-v0_8-darkgrid')
  sns.set_palette("husl")

  # =========================
  # RUTAS DE ARCHIVOS
  # =========================
  # ⚠️ CAMBIA ESTA RUTA al nombre real de tu archivo en Google Drive
  FISICHECKER_XLSX = Path("/content/drive/MyDrive/FisiChecker/auditorias_detalladas_nik.xlsx")

  # =========================
  # FUNCIONES AUXILIARES
  # =========================

  def pick_col(df, candidates, required=False, default=None):
      """Busca la primera columna disponible de una lista de candidatos."""
      for c in candidates:
          if c in df.columns:
              return c
      if required:
          raise KeyError(f"No se encontro ninguna de las columnas requeridas: {candidates}\nColumnas disponibles: {list(df.columns)}")
      return default


  def norm_text(s):
      if pd.isna(s):
          return ""
      return str(s).strip()


  def extract_domain(url):
      if not isinstance(url, str) or not url:
          return ""
      try:
          host = urlparse(url if "://" in url else ("https://" + url)).hostname or ""
          return host.lower()
      except Exception:
          return ""

  # =========================
  # CARGA Y NORMALIZACION
  # =========================
  print("=" * 70)
  print("CARGANDO DATOS...")
  print("=" * 70)

  xls = pd.ExcelFile(FISICHECKER_XLSX)

  audits_df = xls.parse("Resumen")
  results_df = xls.parse("Criterios WCAG")

  # Normalizar nombres de columnas a minúsculas y sin espacios extra
  audits_df.columns = [str(c).strip().lower() for c in audits_df.columns]
  results_df.columns = [str(c).strip().lower() for c in results_df.columns]

  print(f"Columnas en 'Resumen': {list(audits_df.columns)}")
  print(f"Columnas en 'Criterios WCAG': {list(results_df.columns)}")
  print(f"Filas en 'Resumen': {len(audits_df)}")
  print(f"Filas en 'Criterios WCAG': {len(results_df)}")

  # =========================
  # MAPEO DE BANCOS/ENTIDADES CON CORRECCIONES
  # =========================
  DOMAIN_TO_SIGLA = {
      "bcp.com.pe": "BCP",
      "viabcp.com": "BCP",
      "interbank.pe": "Interbank",
      "bbva.pe": "BBVA",
      "scotiabank.com.pe": "Scotiabank",
      "banbif.com.pe": "BanBif",
      "mi-banco.com.pe": "Mibanco",
      "mibanco.com.pe": "Mibanco",
      "bancofalabella.pe": "Falabella",
      "cofide.com.pe": "Cofide",
  }

  SIGLA_TO_FULL = {
      "BCP": "Banco de Credito del Peru (BCP)",
      "Interbank": "Interbank",
      "BBVA": "BBVA Peru",
      "Scotiabank": "Scotiabank Peru",
      "BanBif": "Banco Interamericano de Finanzas (BanBif)",
      "Mibanco": "Mibanco",
      "Falabella": "Banco Falabella Peru",
      "Cofide": "Corporacion Financiera de Desarrollo (Cofide)",
  }


  def domain_to_sigla(url):
      host = extract_domain(url)
      best = None
      for dom, sigla in DOMAIN_TO_SIGLA.items():
          if host.endswith(dom.lower()):
              if best is None or len(dom) > len(best[0]):
                  best = (dom, sigla)
      return best[1] if best else None


  def sigla_to_full(sigla):
      s = norm_text(sigla)
      if s in SIGLA_TO_FULL:
          return SIGLA_TO_FULL[s]
      if len(s) > 5 and " " in s:
          return s
      return None


  # Tras lowercase: "título" → "título", "url" → "url", "id" → "id"
  bank_col  = pick_col(audits_df, ["título", "title", "page_title"])
  full_col  = pick_col(audits_df, ["razon_social", "nombre_comercial", "título", "title"])
  url_col   = pick_col(audits_df, ["url", "website", "sitio"], default=None)
  id_col    = pick_col(audits_df, ["id", "website_audit_id", "audit_id"], required=True)

  aud = audits_df.copy()
  aud["_url"]               = aud[url_col] if url_col else ""
  aud["_sigla_aud"]         = (aud[bank_col].map(norm_text) if bank_col else pd.Series([""] * len(aud)))
  aud["_sigla_url"]         = aud["_url"].map(domain_to_sigla)
  aud["_full_aud"]          = (aud[full_col].map(norm_text) if full_col else pd.Series([""] * len(aud)))
  aud["_full_from_sigla_aud"] = aud["_sigla_aud"].map(sigla_to_full)
  aud["_full_from_sigla_url"] = aud["_sigla_url"].map(sigla_to_full)


  # NORMALIZACION ESPECIAL PARA COFIDE Y MIBANCO
  def normalizar_banco(row):
      texto_completo = f"{row['_sigla_aud']} {row['_full_aud']} {row['_url']}".lower()

      if "cofide" in texto_completo:
          return "Corporacion Financiera de Desarrollo (Cofide)"

      if any(x in texto_completo for x in ["mibanco", "mi-banco", "mi banco"]):
          return "Mibanco"

      if row["_full_aud"]:
          return row["_full_aud"]
      if row["_full_from_sigla_aud"]:
          return row["_full_from_sigla_aud"]
      if row["_full_from_sigla_url"]:
          return row["_full_from_sigla_url"]
      if row["_sigla_aud"]:
          return row["_sigla_aud"]
      if row["_sigla_url"]:
          return row["_sigla_url"]
      return f"Entidad sin nombre (ID {row[id_col]})"


  aud["_bank_name_final"] = aud.apply(normalizar_banco, axis=1)

  bank_map = aud[[id_col, "_bank_name_final"]].drop_duplicates().rename(
      columns={id_col: "website_audit_id", "_bank_name_final": "bank_name"}
  )

  # =========================
  # PREPARAR DATOS DE RESULTADOS
  # =========================
  # Tras lowercase: "criterio", "veredicto", "nivel", "principio", "auditoría id"
  code_col      = pick_col(results_df, ["criterio", "code", "codigo", "wcag"], required=True)
  title_col     = pick_col(results_df, ["título", "title", "titulo", "criterio_titulo", "name"])
  verdict_col   = pick_col(results_df, ["veredicto", "verdict", "resultado", "status"], required=True)
  level_col     = pick_col(results_df, ["nivel", "level", "wcag_level"], required=True)
  principle_col = pick_col(results_df, ["principio", "principle"])
  audit_id_col  = pick_col(results_df, ["auditoría id", "website_audit_id", "audit_id"], required=True)

  df = pd.DataFrame({
      "website_audit_id": results_df[audit_id_col],
      "code":    results_df[code_col].map(norm_text),
      "title":   results_df[title_col].map(norm_text) if title_col else np.nan,
      "verdict": results_df[verdict_col].map(lambda x: norm_text(x).lower()),
      "level":   results_df[level_col].map(lambda x: norm_text(x).upper()),
      "principle": results_df[principle_col] if principle_col else np.nan,
  }).copy()


  # Normalizar principio
  def norm_principle(p, code):
      p = norm_text(p).lower()
      if p:
          if "perce" in p:
              return "Perceptible"
          if "opera" in p:
              return "Operable"
          if "compr" in p or "underst" in p:
              return "Comprensible"
          if "robust" in p or "robusto" in p:
              return "Robusto"
      c = norm_text(code)
      if c.startswith("1."):
          return "Perceptible"
      if c.startswith("2."):
          return "Operable"
      if c.startswith("3."):
          return "Comprensible"
      if c.startswith("4."):
          return "Robusto"
      return "Desconocido"


  df["principle"] = df.apply(lambda r: norm_principle(r.get("principle", ""), r.get("code", "")), axis=1)

  # Unir con informacion de entidades
  df = df.merge(bank_map, on="website_audit_id", how="left")

  # Filtrar solo veredictos validos y excluir N/A (formula Hilera)
  # El nuevo Excel usa "na" para los criterios no aplicables → se excluyen correctamente
  # Incluir N/A en el cálculo (contar como 0 puntos)
  # Mantener todos los veredictos: pass, fail, partial, na
  all_verdicts = {"pass", "fail", "partial", "na"}
  df_invalid = df[~df["verdict"].isin(all_verdicts)]
  df = df[df["verdict"].isin(all_verdicts)].copy()

  print(f"\nEvaluaciones validas (pass/fail/partial/na): {len(df)}")
  print(f"Evaluaciones excluidas (otros): {len(df_invalid)}")

  # =========================
  # VERIFICACION DE ENTIDADES
  # =========================
  print("\n" + "=" * 70)
  print("VERIFICACION DE ENTIDADES IDENTIFICADAS")
  print("=" * 70)

  entidades_unicas = df["bank_name"].unique()
  print(f"\nTotal de entidades unicas: {len(entidades_unicas)}")
  print("\nEntidades identificadas:")
  for entidad in sorted(entidades_unicas):
      count = df[df["bank_name"] == entidad]["website_audit_id"].nunique()
      print(f"  - {entidad}: {count} auditoria(s)")

  print("=" * 70)

  # =========================
  # FUNCIONES DE CALCULO
  # =========================

  def calcular_porcentaje_accesibilidad(grupo_df):
      """
      Formula de Hilera (INCLUYENDO N/A como 0 puntos):
      % = (100*pass + 50*partial + 0*na) / (pass + partial + fail + na)
      """
      cumple    = (grupo_df["verdict"] == "pass").sum()
      parciales = (grupo_df["verdict"] == "partial").sum()
      no_cumple = (grupo_df["verdict"] == "fail").sum()
      no_aplica = (grupo_df["verdict"] == "na").sum()

      total_puntos = cumple + parciales + no_cumple + no_aplica

      if total_puntos == 0:
          return 0.0, 0, 0, 0, 0

      porcentaje = (100 * cumple + 50 * parciales) / total_puntos
      return porcentaje, cumple, parciales, no_cumple, no_aplica


  def clasificar_nivel(porcentaje):
      if porcentaje >= 90:
          return "Alta"
      if porcentaje >= 60:
          return "Moderada"
      if porcentaje >= 35:
          return "Deficiente"
      return "Muy deficiente"


  colores_clasificacion = {
      "Alta":           "#6B9BD1",
      "Moderada":       "#F4A582",
      "Deficiente":     "#BABABA",
      "Muy deficiente": "#F9E79F",
  }

  # =========================
  # PREGUNTAS 1, 2, 3: GRAFICOS CIRCULARES POR NIVEL
  # =========================
  print("\n" + "=" * 70)
  print("PREGUNTAS 1-3: PORCENTAJE DE CUMPLIMIENTO POR NIVEL (A, AA, AAA)")
  print("=" * 70)

  resultados_por_nivel_detalle = []

  for nivel in ["A", "AA", "AAA"]:
      porcentajes_entidades = []
      for entidad in df["bank_name"].unique():
          df_ent_nivel = df[(df["bank_name"] == entidad) & (df["level"] == nivel)]
          if not df_ent_nivel.empty:
              porcentaje, _, _, _, _ = calcular_porcentaje_accesibilidad(df_ent_nivel)
              porcentajes_entidades.append(porcentaje)

      promedio = np.mean(porcentajes_entidades) if porcentajes_entidades else 0.0
      clasificacion = clasificar_nivel(promedio)

      resultados_por_nivel_detalle.append({
          "Nivel":       nivel,
          "Porcentaje":  round(promedio, 2),
          "Clasificacion": clasificacion,
          "N_Entidades": len(porcentajes_entidades),
      })

  # Graficos circulares individuales
  for idx, nivel in enumerate(["A", "AA", "AAA"]):
      result = resultados_por_nivel_detalle[idx]

      clasificaciones_nivel = []
      for entidad in df["bank_name"].unique():
          df_ent_nivel = df[(df["bank_name"] == entidad) & (df["level"] == nivel)]
          if not df_ent_nivel.empty:
              porcentaje, _, _, _, _ = calcular_porcentaje_accesibilidad(df_ent_nivel)
              clasificacion = clasificar_nivel(porcentaje)
              clasificaciones_nivel.append(clasificacion)

      conteo = Counter(clasificaciones_nivel)

      labels = []
      sizes  = []
      colors = []

      for clasificacion in ["Alta", "Moderada", "Deficiente", "Muy deficiente"]:
          if conteo[clasificacion] > 0:
              labels.append(clasificacion)
              sizes.append(conteo[clasificacion])
              colors.append(colores_clasificacion[clasificacion])

      if not sizes:
          print(f"\nNivel {nivel}: sin datos suficientes para grafico circular.")
          continue

      fig, ax = plt.subplots(figsize=(10, 8))

      wedges, texts, autotexts = ax.pie(
          sizes,
          labels=None,
          colors=colors,
          autopct='%1.1f%%',
          startangle=90,
          textprops={'fontsize': 16, 'weight': 'bold', 'color': 'black'}
      )

      ax.text(0, 0, f"Promedio\n{result['Porcentaje']:.2f}%",
              ha='center', va='center', fontsize=14, weight='bold', color='black')

      for i, autotext in enumerate(autotexts):
          if labels[i] in ["Deficiente"]:
              autotext.set_color('white')
          else:
              autotext.set_color('black')

      ax.set_title(
          f"Niveles de Accesibilidad\nNivel {nivel}",
          fontsize=18, weight='normal', color='gray', pad=20
      )
      ax.legend(
          labels, loc='upper center',
          bbox_to_anchor=(0.5, -0.05), ncol=4, frameon=False, fontsize=12
      )

      plt.tight_layout()
      plt.show()

  # Tabla resumen
  df_niveles = pd.DataFrame(resultados_por_nivel_detalle)
  print("\nTabla 1: Resumen de cumplimiento por nivel WCAG")
  print(df_niveles.to_string(index=False))
  print("\nCriterios de clasificacion:")
  print("  - Alta:           90-100%")
  print("  - Moderada:       60-89%")
  print("  - Deficiente:     35-59%")
  print("  - Muy deficiente: 0-34%")

  # =========================
  # PREGUNTA 4: TABLA DE CRITERIOS POR PAUTA Y NIVEL
  # =========================
  print("\n" + "=" * 70)
  print("PREGUNTA 4: CANTIDAD DE CRITERIOS POR PAUTA Y NIVEL")
  print("=" * 70)


  def crear_tabla_pauta_nivel(df_in, estado):
      tmp = df_in.loc[df_in["verdict"].eq(estado)].copy()
      if tmp.empty:
          return pd.DataFrame()

      tab = (tmp.groupby(["principle", "level"])["code"]
            .nunique()
            .unstack(fill_value=0)
            .reindex(columns=["A", "AA", "AAA"], fill_value=0))

      orden_principios = ["Perceptible", "Operable", "Comprensible", "Robusto"]
      tab = tab.reindex(orden_principios, fill_value=0)

      return tab


  tabla_correctos   = crear_tabla_pauta_nivel(df, "pass")
  tabla_incorrectos = crear_tabla_pauta_nivel(df, "fail")
  tabla_verificables = crear_tabla_pauta_nivel(df, "partial")

  print("\nTabla 2: Cantidad de criterios unicos por pauta y nivel")
  print("\n--- CORRECTOS (PASS) ---")
  print(tabla_correctos if not tabla_correctos.empty else "Sin datos")
  print("\n--- INCORRECTOS (FAIL) ---")
  print(tabla_incorrectos if not tabla_incorrectos.empty else "Sin datos")
  print("\n--- VERIFICABLES (PARTIAL) ---")
  print(tabla_verificables if not tabla_verificables.empty else "Sin datos")

  # Grafico de barras apiladas por principio
  if not tabla_correctos.empty:
      fig, ax = plt.subplots(figsize=(12, 6))

      x = np.arange(len(tabla_correctos.index))
      width = 0.25

      for i, nivel in enumerate(["A", "AA", "AAA"]):
          vals_correctos   = tabla_correctos[nivel].values   if nivel in tabla_correctos.columns   else [0] * len(x)
          vals_incorrectos = tabla_incorrectos[nivel].values if nivel in tabla_incorrectos.columns else [0] * len(x)

          ax.bar(x + i * width, vals_correctos, width,
                label=f"Nivel {nivel} - Correctos", alpha=0.8)
          ax.bar(x + i * width, vals_incorrectos, width,
                bottom=vals_correctos, label=f"Nivel {nivel} - Incorrectos", alpha=0.6, hatch='//')

      ax.set_xlabel('Principios WCAG', fontsize=12)
      ax.set_ylabel('Cantidad de criterios', fontsize=12)
      ax.set_title('Distribucion de criterios por pauta y nivel\n(Correctos vs Incorrectos)', fontsize=14, weight='bold')
      ax.set_xticks(x + width)
      ax.set_xticklabels(tabla_correctos.index, rotation=0)
      ax.legend(loc='best', fontsize=9, ncol=2)
      ax.grid(axis='y', alpha=0.3)

      plt.tight_layout()
      plt.show()

  # =========================
  # PREGUNTA 5: PRINCIPIO CON MENOR CUMPLIMIENTO
  # =========================
  print("\n" + "=" * 70)
  print("PREGUNTA 5: PRINCIPIO CON MENOR CUMPLIMIENTO")
  print("=" * 70)

  resultados_principio = []

  for principio in ["Perceptible", "Operable", "Comprensible", "Robusto"]:
      df_principio = df[df["principle"] == principio]

      if not df_principio.empty:
          porcentaje, cumple, parcial, falla, no_aplica = calcular_porcentaje_accesibilidad(df_principio)
          total = cumple + parcial + falla + no_aplica

          resultados_principio.append({
              "Principio":  principio,
              "Porcentaje": round(porcentaje, 2),
              "Cumple":     cumple,
              "Parcial":    parcial,
              "Falla":      falla,
              "No Aplica":  no_aplica,
              "Total":      total
          })

  df_principios = pd.DataFrame(resultados_principio).sort_values("Porcentaje")

  print("\nTabla 3: Cumplimiento por principio WCAG")
  print(df_principios.to_string(index=False))

  menor_principio  = df_principios.iloc[0]["Principio"]  if not df_principios.empty else "N/A"
  menor_porcentaje = df_principios.iloc[0]["Porcentaje"] if not df_principios.empty else 0.0

  print(f"\nPrincipio con menor cumplimiento: {menor_principio} ({menor_porcentaje}%)")

  # Grafico de barras horizontal
  fig, ax = plt.subplots(figsize=(10, 6))
  bars = ax.barh(
      df_principios["Principio"], df_principios["Porcentaje"],
      color=['#e74c3c' if i == 0 else '#3498db' for i in range(len(df_principios))]
  )
  ax.set_xlabel('Porcentaje de cumplimiento (%)', fontsize=12)
  ax.set_title('Cumplimiento por Principio WCAG\n(Ordenado de menor a mayor)', fontsize=14, weight='bold')
  ax.set_xlim(0, 100)
  for i, (p, v) in enumerate(zip(df_principios["Principio"], df_principios["Porcentaje"])):
      ax.text(v + 1, i, f'{v:.1f}%', va='center', fontsize=10, weight='bold')
  plt.tight_layout()
  plt.show()

  # =========================
  # PREGUNTA 6: RANKING Y DISPERSION
  # =========================
  print("\n" + "=" * 70)
  print("PREGUNTA 6: RANKING DE ENTIDADES Y CONCENTRACION")
  print("=" * 70)

  resultados_entidades = []

  for entidad in df["bank_name"].unique():
      df_ent = df[df["bank_name"] == entidad]

      porcentaje, cumple, parcial, falla, no_aplica = calcular_porcentaje_accesibilidad(df_ent)
      total_criterios = cumple + parcial + falla + no_aplica

      resultados_entidades.append({
          "Entidad":        entidad,
          "Porcentaje":     round(porcentaje, 2),
          "Cumple":         cumple,
          "Parcial":        parcial,
          "Falla":          falla,
          "No Aplica":      no_aplica,
          "Total evaluado": total_criterios,
          "Clasificacion":  clasificar_nivel(porcentaje)
      })

  df_entidades = pd.DataFrame(resultados_entidades).sort_values("Porcentaje", ascending=False)
  df_entidades.index = range(1, len(df_entidades) + 1)

  # Renombrar columna para mostrar (compatible con codigo de bancos)
  df_bancos = df_entidades.rename(columns={"Entidad": "Banco"})

  print("\nTabla 4: Ranking completo por nivel de accesibilidad")
  print(df_bancos.to_string())

  print("\nESTADISTICAS GENERALES:")
  print(f"  - Promedio:           {df_bancos['Porcentaje'].mean():.2f}%")
  print(f"  - Mediana:            {df_bancos['Porcentaje'].median():.2f}%")
  print(f"  - Desviacion estandar: {df_bancos['Porcentaje'].std():.2f}")
  print(f"  - Maximo:             {df_bancos['Porcentaje'].max():.2f}% ({df_bancos.iloc[0]['Banco']})")
  print(f"  - Minimo:             {df_bancos['Porcentaje'].min():.2f}% ({df_bancos.iloc[-1]['Banco']})")

  print("\nDISTRIBUCION POR CLASIFICACION:")
  distribucion = df_bancos["Clasificacion"].value_counts()
  for nivel in ["Alta", "Moderada", "Deficiente", "Muy deficiente"]:
      if nivel in distribucion.index:
          cantidad = distribucion[nivel]
          pct_dist = (cantidad / len(df_bancos)) * 100
          print(f"  - {nivel}: {cantidad} entidades ({pct_dist:.1f}%)")

  # Grafico de dispersion
  if len(df_bancos) > 1:
      fig, ax = plt.subplots(figsize=(14, 7))
      colores = df_bancos["Clasificacion"].map(colores_clasificacion)
      ax.scatter(
          range(1, len(df_bancos) + 1),
          df_bancos["Porcentaje"],
          c=colores, s=200, alpha=0.7, edgecolors='black', linewidth=0.8
      )
      ax.axhline(y=90, color='green',  linestyle='--', alpha=0.4, linewidth=1.5, label='Alta (>=90%)')
      ax.axhline(y=60, color='orange', linestyle='--', alpha=0.4, linewidth=1.5, label='Moderada (>=60%)')
      ax.axhline(y=35, color='red',    linestyle='--', alpha=0.4, linewidth=1.5, label='Deficiente (>=35%)')

      z = np.polyfit(range(1, len(df_bancos) + 1), df_bancos["Porcentaje"], 1)
      p = np.poly1d(z)
      ax.plot(range(1, len(df_bancos) + 1), p(range(1, len(df_bancos) + 1)),
              "k--", alpha=0.5, linewidth=2, label='Tendencia')

      ax.set_xlabel('Entidades (ordenadas por ranking)', fontsize=13, weight='bold')
      ax.set_ylabel('Nivel de accesibilidad (%)', fontsize=13, weight='bold')
      total_entidades = len(df_bancos)
      ax.set_title(f'Concentracion de niveles de accesibilidad\nEntre {total_entidades} entidades evaluadas',
                  fontsize=15, weight='bold', pad=20)
      ax.set_ylim(0, 100)
      ax.set_xlim(0, len(df_bancos) + 1)
      ax.grid(True, alpha=0.3)
      ax.legend(loc='best', fontsize=10)

      plt.tight_layout()
      plt.show()

  # =========================
  # PREGUNTA 7: TOP 5 ENTIDADES - ANALISIS DETALLADO
  # =========================
  print("\n" + "=" * 70)
  print("PREGUNTA 7: ANALISIS DETALLADO DE LAS 5 MEJORES ENTIDADES")
  print("=" * 70)

  top5_bancos = df_bancos.head(5)["Banco"].tolist()

  print("\nTop 5 entidades seleccionadas:")
  for i, banco in enumerate(top5_bancos, 1):
      print(f"  {i}. {banco}")

  print("\nDetalle por principio y nivel:")
  for banco in top5_bancos:
      df_banco = df[df["bank_name"] == banco]
      print(f"\n{banco}:")

      for principio in ["Perceptible", "Operable", "Comprensible", "Robusto"]:
          print(f"  {principio}:", end=" ")
          for nivel in ["A", "AA", "AAA"]:
              df_subset = df_banco[(df_banco["principle"] == principio) & (df_banco["level"] == nivel)]
              cumple      = (df_subset["verdict"] == "pass").sum()
              total_nivel = len(df_subset)
              if total_nivel > 0:
                  print(f"{nivel}({cumple}/{total_nivel})", end=" ")
          print()

  # Grafico comparativo top 5 (solo si hay suficientes datos)
  if len(top5_bancos) >= 1:
      fig, axes = plt.subplots(2, 3, figsize=(18, 10))
      axes = axes.flatten()

      for idx, nivel in enumerate(["A", "AA", "AAA"]):
          labels = [b[:15] + "..." if len(b) > 15 else b for b in top5_bancos]

          # Correctos
          ax = axes[idx]
          data_plot = []
          for banco in top5_bancos:
              df_bn = df[(df["bank_name"] == banco) & (df["level"] == nivel)]
              data_plot.append((df_bn["verdict"] == "pass").sum())

          ax.barh(labels, data_plot, color='#2ecc71', alpha=0.8)
          ax.set_xlabel('Criterios correctos', fontsize=10)
          ax.set_title(f'Nivel {nivel} - Correctos', fontsize=12, weight='bold')
          ax.grid(axis='x', alpha=0.3)

          # Incorrectos
          ax = axes[idx + 3]
          data_plot = []
          for banco in top5_bancos:
              df_bn = df[(df["bank_name"] == banco) & (df["level"] == nivel)]
              data_plot.append((df_bn["verdict"] == "fail").sum())

          ax.barh(labels, data_plot, color='#e74c3c', alpha=0.8)
          ax.set_xlabel('Criterios incorrectos', fontsize=10)
          ax.set_title(f'Nivel {nivel} - Incorrectos', fontsize=12, weight='bold')
          ax.grid(axis='x', alpha=0.3)

      plt.suptitle('Analisis detallado: Top 5 entidades con mejor accesibilidad',
                  fontsize=16, weight='bold', y=1.00)
      plt.tight_layout()
      plt.show()

  # =========================
  # PREGUNTA 8: CUMPLIMIENTO POR ENTIDAD Y NIVEL
  # =========================
  print("\n" + "=" * 70)
  print("PREGUNTA 8: CUMPLIMIENTO POR ENTIDAD EN CADA NIVEL WCAG (A, AA, AAA)")
  print("=" * 70)

  matriz_banco_nivel = []

  for banco in sorted(df["bank_name"].unique()):
      fila = {"Banco": banco[:40]}

      for nivel in ["A", "AA", "AAA"]:
          df_bn = df[(df["bank_name"] == banco) & (df["level"] == nivel)]

          if not df_bn.empty:
              porcentaje, cumple, parcial, falla, no_aplica = calcular_porcentaje_accesibilidad(df_bn)
              total = cumple + parcial + falla
              fila[f"% Nivel {nivel}"] = round(porcentaje, 1)
              fila[f"N_crit_{nivel}"]  = total
              fila[f"Clasif_{nivel}"]  = clasificar_nivel(porcentaje)
          else:
              fila[f"% Nivel {nivel}"] = 0.0
              fila[f"N_crit_{nivel}"]  = 0
              fila[f"Clasif_{nivel}"]  = "-"

      promedios = [fila[f"% Nivel {n}"] for n in ["A", "AA", "AAA"] if fila[f"% Nivel {n}"] > 0]
      fila["Promedio general"] = round(np.mean(promedios), 1) if promedios else 0.0

      matriz_banco_nivel.append(fila)

  df_matriz = pd.DataFrame(matriz_banco_nivel).sort_values("Promedio general", ascending=False)
  df_matriz.index = range(1, len(df_matriz) + 1)

  print("\nTabla 8: Matriz de cumplimiento por entidad y nivel WCAG")
  print(df_matriz[["Banco", "% Nivel A", "% Nivel AA", "% Nivel AAA", "Promedio general"]].to_string())

  # MAPA DE CALOR
  fig, ax = plt.subplots(figsize=(12, max(6, len(df_matriz) * 0.5 + 2)))

  datos_heatmap = df_matriz[["% Nivel A", "% Nivel AA", "% Nivel AAA"]].values
  bancos_labels = [b[:30] + "..." if len(b) > 30 else b for b in df_matriz["Banco"]]

  im = ax.imshow(datos_heatmap, cmap='RdYlGn', aspect='auto', vmin=0, vmax=100)

  ax.set_xticks(np.arange(3))
  ax.set_yticks(np.arange(len(bancos_labels)))
  ax.set_xticklabels(["Nivel A", "Nivel AA", "Nivel AAA"], fontsize=12, weight='bold')
  ax.set_yticklabels(bancos_labels, fontsize=9)

  for i in range(len(bancos_labels)):
      for j in range(3):
          valor = datos_heatmap[i, j]
          color = 'white' if valor < 50 else 'black'
          ax.text(j, i, f'{valor:.1f}%', ha="center", va="center",
                  color=color, fontsize=8, weight='bold')

  ax.set_title('Mapa de calor: Cumplimiento por entidad y nivel WCAG\n(Ordenado por promedio general)',
              fontsize=15, weight='bold', pad=20)

  cbar = plt.colorbar(im, ax=ax)
  cbar.set_label('Porcentaje de cumplimiento (%)', rotation=270, labelpad=20, fontsize=11)

  plt.tight_layout()
  plt.show()

  # Analisis estadistico por nivel
  print("\nANALISIS ESTADISTICO POR NIVEL:")
  for nivel in ["A", "AA", "AAA"]:
      col    = f"% Nivel {nivel}"
      valores = df_matriz[col]

      print(f"\nNivel {nivel}:")
      print(f"  - Promedio:       {valores.mean():.2f}%")
      print(f"  - Mediana:        {valores.median():.2f}%")
      print(f"  - Desv. estandar: {valores.std():.2f}")
      print(f"  - Rango:          {valores.min():.2f}% - {valores.max():.2f}%")

      mejor_idx = valores.idxmax()
      peor_idx  = valores.idxmin()
      print(f"  - Mejor: {df_matriz.loc[mejor_idx, 'Banco'][:40]} ({valores[mejor_idx]:.1f}%)")
      print(f"  - Peor:  {df_matriz.loc[peor_idx,  'Banco'][:40]} ({valores[peor_idx]:.1f}%)")

  # Grafico de barras agrupadas Top N
  top_n = min(10, len(df_matriz))
  top10 = df_matriz.head(top_n)

  fig, ax = plt.subplots(figsize=(14, 8))
  x = np.arange(len(top10))
  width = 0.25

  ax.bar(x - width, top10["% Nivel A"],   width, label='Nivel A',   alpha=0.8, color='#3498db')
  ax.bar(x,         top10["% Nivel AA"],  width, label='Nivel AA',  alpha=0.8, color='#2ecc71')
  ax.bar(x + width, top10["% Nivel AAA"], width, label='Nivel AAA', alpha=0.8, color='#9b59b6')

  ax.set_xlabel(f'Entidades (Top {top_n})', fontsize=12, weight='bold')
  ax.set_ylabel('Porcentaje de cumplimiento (%)', fontsize=12, weight='bold')
  ax.set_title(f'Comparacion de cumplimiento por nivel WCAG - Top {top_n} entidades',
              fontsize=14, weight='bold', pad=20)
  ax.set_xticks(x)
  ax.set_xticklabels([b[:20] + "..." if len(b) > 20 else b for b in top10["Banco"]],
                    rotation=45, ha='right', fontsize=9)
  ax.legend(fontsize=11)
  ax.set_ylim(0, 110)
  ax.grid(axis='y', alpha=0.3)

  plt.tight_layout()
  plt.show()

  # =========================
  # PREGUNTA 9: DISTRIBUCION DE ESTADOS POR NIVEL
  # =========================
  print("\n" + "=" * 70)
  print("PREGUNTA 9: DISTRIBUCION DE ESTADOS (CORRECTOS/INCORRECTOS/VERIFICABLES)")
  print("=" * 70)

  distribucion_estados = []

  for nivel in ["A", "AA", "AAA"]:
      df_nivel    = df[df["level"] == nivel]
      total       = len(df_nivel)
      correctos    = (df_nivel["verdict"] == "pass").sum()
      incorrectos  = (df_nivel["verdict"] == "fail").sum()
      verificables = (df_nivel["verdict"] == "partial").sum()
      no_aplicables = (df_nivel["verdict"] == "na").sum()

      distribucion_estados.append({
          "Nivel":          nivel,
          "Correctos":      correctos,
          "Incorrectos":    incorrectos,
          "Verificables":   verificables,
          "No Aplicables":  no_aplicables,
          "Total":          total,
          "% Correctos":    round(correctos    / total * 100, 1) if total > 0 else 0,
          "% Incorrectos":  round(incorrectos  / total * 100, 1) if total > 0 else 0,
          "% Verificables": round(verificables / total * 100, 1) if total > 0 else 0,
          "% No Aplicables": round(no_aplicables / total * 100, 1) if total > 0 else 0
      })

  df_distribucion = pd.DataFrame(distribucion_estados)

  print("\nTabla 9: Distribucion de estados por nivel WCAG")
  print(df_distribucion.to_string(index=False))

  # Grafico: Barras apiladas 100%
  fig, ax = plt.subplots(figsize=(12, 7))

  niveles           = df_distribucion["Nivel"]
  correctos_pct     = df_distribucion["% Correctos"]
  incorrectos_pct   = df_distribucion["% Incorrectos"]
  verificables_pct  = df_distribucion["% Verificables"]
  no_aplicables_pct = df_distribucion["% No Aplicables"]

  x = np.arange(len(niveles))
  width = 0.6

  ax.bar(x, correctos_pct,   width, label='Correctos (PASS)',    color='#2ecc71', alpha=0.9)
  ax.bar(x, incorrectos_pct, width, bottom=correctos_pct,        label='Incorrectos (FAIL)',   color='#e74c3c', alpha=0.9)
  ax.bar(x, verificables_pct, width,
      bottom=correctos_pct + incorrectos_pct,                  label='Verificables (PARTIAL)', color='#f39c12', alpha=0.9)
  ax.bar(x, no_aplicables_pct, width,
      bottom=correctos_pct + incorrectos_pct + verificables_pct, label='No Aplicables (NA)', color='#95a5a6', alpha=0.9)

  ax.set_ylabel('Porcentaje (%)', fontsize=13, weight='bold')
  ax.set_xlabel('Nivel WCAG', fontsize=13, weight='bold')
  ax.set_title('Distribucion porcentual de estados por nivel WCAG',
              fontsize=15, weight='bold', pad=20)
  ax.set_xticks(x)
  ax.set_xticklabels(niveles, fontsize=12)
  ax.legend(loc='upper right', fontsize=11)
  ax.set_ylim(0, 100)

  for i in range(len(niveles)):
      if correctos_pct.iloc[i] > 5:
          ax.text(i, correctos_pct.iloc[i] / 2,
                  f'{correctos_pct.iloc[i]:.1f}%',
                  ha='center', va='center', color='white', fontsize=10, weight='bold')
      if incorrectos_pct.iloc[i] > 5:
          ax.text(i, correctos_pct.iloc[i] + incorrectos_pct.iloc[i] / 2,
                  f'{incorrectos_pct.iloc[i]:.1f}%',
                  ha='center', va='center', color='white', fontsize=10, weight='bold')
      if verificables_pct.iloc[i] > 5:
          ax.text(i, correctos_pct.iloc[i] + incorrectos_pct.iloc[i] + verificables_pct.iloc[i] / 2,
                  f'{verificables_pct.iloc[i]:.1f}%',
                  ha='center', va='center', color='white', fontsize=10, weight='bold')
      if no_aplicables_pct.iloc[i] > 5:
          ax.text(i, correctos_pct.iloc[i] + incorrectos_pct.iloc[i] + verificables_pct.iloc[i] + no_aplicables_pct.iloc[i] / 2,
                  f'{no_aplicables_pct.iloc[i]:.1f}%',
                  ha='center', va='center', color='white', fontsize=10, weight='bold')

  plt.tight_layout()
  plt.show()

  # Distribucion general
  print("\nDISTRIBUCION GENERAL (TODOS LOS NIVELES):")
  total_general      = len(df)
  correctos_general     = (df["verdict"] == "pass").sum()
  incorrectos_general   = (df["verdict"] == "fail").sum()
  verificables_general  = (df["verdict"] == "partial").sum()
  no_aplicables_general = (df["verdict"] == "na").sum()

  print(f"  - Correctos  (PASS):       {correctos_general}  ({correctos_general/total_general*100:.1f}%)")
  print(f"  - Incorrectos (FAIL):      {incorrectos_general} ({incorrectos_general/total_general*100:.1f}%)")
  print(f"  - Verificables (PARTIAL):  {verificables_general} ({verificables_general/total_general*100:.1f}%)")
  print(f"  - No Aplicables (NA):      {no_aplicables_general} ({no_aplicables_general/total_general*100:.1f}%)")
  print(f"  - Total de evaluaciones:   {total_general}")

  fig, ax = plt.subplots(figsize=(10, 7))

  sizes = [correctos_general, incorrectos_general, verificables_general]
  labels = [f'Correctos\n{correctos_general/total_general*100:.1f}%',
            f'Incorrectos\n{incorrectos_general/total_general*100:.1f}%',
            f'Verificables\n{verificables_general/total_general*100:.1f}%']
  colors  = ['#2ecc71', '#e74c3c', '#f39c12']
  explode = (0.05, 0.05, 0.05)

  wedges, texts, autotexts = ax.pie(
      sizes, explode=explode, labels=labels, colors=colors,
      autopct='%1.1f%%', startangle=90, textprops={'fontsize': 11}
  )
  for autotext in autotexts:
      autotext.set_color('white')
      autotext.set_weight('bold')
      autotext.set_fontsize(12)

  total_entidades = len(df["bank_name"].unique())
  ax.set_title(f'Distribucion general de estados de cumplimiento\n(Todos los niveles WCAG - {total_entidades} entidades)',
              fontsize=14, weight='bold', pad=20)

  plt.tight_layout()
  plt.show()

  # =========================
  # PREGUNTA 10: BRECHA POR NIVEL WCAG
  # =========================
  print("\n" + "=" * 70)
  print("PREGUNTA 10: ANALISIS DE BRECHAS POR NIVEL WCAG")
  print("=" * 70)

  brechas_nivel = []

  for nivel in ["A", "AA", "AAA"]:
      porcentajes_nivel = []

      for entidad in df["bank_name"].unique():
          df_en = df[(df["bank_name"] == entidad) & (df["level"] == nivel)]

          if not df_en.empty:
              porcentaje, _, _, _, _ = calcular_porcentaje_accesibilidad(df_en)
              porcentajes_nivel.append((entidad, porcentaje))

      if len(porcentajes_nivel) >= 2:
          sorted_pct   = sorted(porcentajes_nivel, key=lambda x: x[1], reverse=True)
          mejor_banco, mejor_pct = sorted_pct[0]
          peor_banco,  peor_pct  = sorted_pct[-1]
          brecha   = mejor_pct - peor_pct
          promedio = np.mean([p for _, p in porcentajes_nivel])

          brechas_nivel.append({
              "Nivel":       nivel,
              "Mejor banco": mejor_banco[:30],
              "Mejor %":     round(mejor_pct, 2),
              "Peor banco":  peor_banco[:30],
              "Peor %":      round(peor_pct, 2),
              "Brecha (pp)": round(brecha, 2),
              "Promedio":    round(promedio, 2)
          })

  if brechas_nivel:
      df_brechas = pd.DataFrame(brechas_nivel)
      print("\nTabla 10: Brechas por nivel WCAG")
      print(df_brechas.to_string(index=False))

      fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

      x     = np.arange(len(df_brechas))
      width = 0.35

      ax1.bar(x - width/2, df_brechas["Mejor %"], width, label='Mejor entidad', color='#2ecc71', alpha=0.8)
      ax1.bar(x + width/2, df_brechas["Peor %"],  width, label='Peor entidad',  color='#e74c3c', alpha=0.8)

      ax1.set_xlabel('Nivel WCAG', fontsize=12)
      ax1.set_ylabel('Porcentaje de accesibilidad (%)', fontsize=12)
      ax1.set_title('Comparacion: Mejor vs Peor entidad por nivel', fontsize=14, weight='bold')
      ax1.set_xticks(x)
      ax1.set_xticklabels(df_brechas["Nivel"])
      ax1.legend()
      ax1.grid(axis='y', alpha=0.3)
      ax1.set_ylim(0, 100)

      for i, row in df_brechas.iterrows():
          ax1.text(i - width/2, row["Mejor %"] + 2, f"{row['Mejor %']:.1f}%", ha='center', fontsize=9, weight='bold')
          ax1.text(i + width/2, row["Peor %"]  + 2, f"{row['Peor %']:.1f}%",  ha='center', fontsize=9, weight='bold')

      ax2.bar(df_brechas["Nivel"], df_brechas["Brecha (pp)"], color='#f39c12', alpha=0.8)
      ax2.set_xlabel('Nivel WCAG', fontsize=12)
      ax2.set_ylabel('Brecha (puntos porcentuales)', fontsize=12)
      ax2.set_title('Brecha entre mejor y peor entidad por nivel', fontsize=14, weight='bold')
      ax2.grid(axis='y', alpha=0.3)

      for i, (nivel_str, brecha) in enumerate(zip(df_brechas["Nivel"], df_brechas["Brecha (pp)"])):
          ax2.text(i, brecha + 1, f"{brecha:.1f} pp", ha='center', fontsize=10, weight='bold')

      plt.tight_layout()
      plt.show()

  else:
      print("\nNo hay suficientes entidades por nivel para calcular brechas (se necesitan al menos 2 por nivel).")

  # =========================
  # RESUMEN EJECUTIVO
  # =========================
  print("\n" + "=" * 70)
  print("RESUMEN EJECUTIVO")
  print("=" * 70)

  if not df_niveles.empty:
      for _, row in df_niveles.iterrows():
          print(f"  Nivel {row['Nivel']:3s}: {row['Porcentaje']:5.2f}% → {row['Clasificacion']}")

  if not df_principios.empty:
      print(f"\nPrincipio mas problematico: {menor_principio} ({menor_porcentaje:.2f}%)")

  print("=" * 70)
  print("ANALISIS COMPLETO FINALIZADO")
  print("=" * 70)

  # =========================
  # EXPORTACION A EXCEL
  # =========================
  print("\n" + "=" * 70)
  print("EXPORTANDO RESULTADOS A EXCEL...")
  print("=" * 70)

  output_dir = Path("/content/drive/MyDrive/FisiChecker/Resultados_Analisis")
  output_dir.mkdir(parents=True, exist_ok=True)

  charts_dir = output_dir / "graficos"
  charts_dir.mkdir(exist_ok=True)

  timestamp    = pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")
  EXCEL_OUTPUT = output_dir / f"Analisis_Accesibilidad_{timestamp}.xlsx"

  print(f"\nArchivo de salida: {EXCEL_OUTPUT}")

  # Guardar graficos circulares por nivel
  graficos_guardados = {}

  for idx, nivel in enumerate(["A", "AA", "AAA"]):
      if idx >= len(resultados_por_nivel_detalle):
          continue
      result = resultados_por_nivel_detalle[idx]

      clasificaciones_nivel = []
      for entidad in df["bank_name"].unique():
          df_en = df[(df["bank_name"] == entidad) & (df["level"] == nivel)]
          if not df_en.empty:
              pct, _, _, _, _ = calcular_porcentaje_accesibilidad(df_en)
              clasificaciones_nivel.append(clasificar_nivel(pct))

      conteo = Counter(clasificaciones_nivel)
      labels, sizes, colors = [], [], []

      for clasif in ["Alta", "Moderada", "Deficiente", "Muy deficiente"]:
          if conteo[clasif] > 0:
              labels.append(clasif)
              sizes.append(conteo[clasif])
              colors.append(colores_clasificacion[clasif])

      if not sizes:
          continue

      fig, ax = plt.subplots(figsize=(10, 8))
      _, _, autotexts = ax.pie(
          sizes, labels=None, colors=colors, autopct='%1.1f%%', startangle=90,
          textprops={'fontsize': 16, 'weight': 'bold', 'color': 'black'}
      )
      for i, autotext in enumerate(autotexts):
          autotext.set_color('white' if labels[i] == "Deficiente" else 'black')

      ax.text(0, 0, f"Promedio\n{result['Porcentaje']:.2f}%",
              ha='center', va='center', fontsize=14, weight='bold', color='black')
      ax.set_title(f"Niveles de Accesibilidad\nNivel {nivel}", fontsize=18, weight='normal', color='gray', pad=20)
      ax.legend(labels, loc='upper center', bbox_to_anchor=(0.5, -0.05), ncol=4, frameon=False, fontsize=12)

      plt.tight_layout()
      nombre = f"01_circular_nivel_{nivel}.png"
      key    = f"p{idx+1}_circular_{nivel}"
      graficos_guardados[key] = str(charts_dir / nombre)
      plt.savefig(graficos_guardados[key], dpi=300, bbox_inches='tight')
      plt.close()

  # Exportar a Excel
  with pd.ExcelWriter(EXCEL_OUTPUT, engine='xlsxwriter') as writer:
      workbook = writer.book

      fmt_header     = workbook.add_format({'bold': True, 'bg_color': '#4472C4', 'font_color': 'white',
                                            'align': 'center', 'valign': 'vcenter', 'border': 1})
      fmt_titulo     = workbook.add_format({'bold': True, 'font_size': 14, 'align': 'left'})
      fmt_porcentaje = workbook.add_format({'num_format': '0.0"%"', 'align': 'center'})

      # Hoja 1: Resumen Ejecutivo
      ws_resumen = workbook.add_worksheet('Resumen Ejecutivo')
      writer.sheets['Resumen Ejecutivo'] = ws_resumen

      r = 0
      ws_resumen.write(r, 0, "ANALISIS DE ACCESIBILIDAD WEB", fmt_titulo)
      ws_resumen.set_row(r, 20)
      r += 2
      ws_resumen.write(r, 0, "Total entidades analizadas:", fmt_header)
      ws_resumen.write(r, 1, len(df_bancos))
      r += 1
      ws_resumen.write(r, 0, "Fecha del analisis:", fmt_header)
      ws_resumen.write(r, 1, pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"))
      r += 1
      ws_resumen.write(r, 0, "Archivo fuente:", fmt_header)
      ws_resumen.write(r, 1, str(FISICHECKER_XLSX))
      r += 3

      ws_resumen.write(r, 0, "CUMPLIMIENTO POR NIVEL WCAG", fmt_titulo)
      r += 1
      df_niveles.to_excel(writer, sheet_name='Resumen Ejecutivo', startrow=r, index=False)
      for col_num, value in enumerate(df_niveles.columns):
          ws_resumen.write(r, col_num, value, fmt_header)

      img_row = r + df_niveles.shape[0] + 2
      if 'p1_circular_A'   in graficos_guardados:
          ws_resumen.insert_image(img_row,      0, graficos_guardados['p1_circular_A'],   {'x_scale': 0.35, 'y_scale': 0.35})
      if 'p2_circular_AA'  in graficos_guardados:
          ws_resumen.insert_image(img_row,      5, graficos_guardados['p2_circular_AA'],  {'x_scale': 0.35, 'y_scale': 0.35})
      if 'p3_circular_AAA' in graficos_guardados:
          ws_resumen.insert_image(img_row + 20, 0, graficos_guardados['p3_circular_AAA'], {'x_scale': 0.35, 'y_scale': 0.35})

      ws_resumen.set_column('A:A', 30)
      ws_resumen.set_column('B:D', 15)

      # Hoja 2: Ranking
      df_bancos_exp = df_bancos.reset_index(drop=False).rename(columns={'index': 'Posicion'})
      df_bancos_exp.to_excel(writer, sheet_name='Ranking de Entidades', index=False)
      ws_ranking = writer.sheets['Ranking de Entidades']
      for col_num, col_name in enumerate(df_bancos_exp.columns):
          ws_ranking.write(0, col_num, col_name, fmt_header)
      ws_ranking.set_column('B:B', 40)
      ws_ranking.set_column('C:H', 12)

      # Hoja 3: Criterios por Pauta
      ws_pauta = workbook.add_worksheet('Criterios por Pauta')
      writer.sheets['Criterios por Pauta'] = ws_pauta

      r = 0
      ws_pauta.write(r, 0, "CORRECTOS (PASS)", fmt_titulo); r += 1
      tabla_correctos.to_excel(writer, sheet_name='Criterios por Pauta', startrow=r)
      r += tabla_correctos.shape[0] + 3

      ws_pauta.write(r, 0, "INCORRECTOS (FAIL)", fmt_titulo); r += 1
      tabla_incorrectos.to_excel(writer, sheet_name='Criterios por Pauta', startrow=r)
      r += tabla_incorrectos.shape[0] + 3

      ws_pauta.write(r, 0, "VERIFICABLES (PARTIAL)", fmt_titulo); r += 1
      tabla_verificables.to_excel(writer, sheet_name='Criterios por Pauta', startrow=r)

      ws_pauta.set_column('A:A', 20)
      ws_pauta.set_column('B:D', 12)

      # Hoja 4: Cumplimiento por Principio
      df_principios.to_excel(writer, sheet_name='Cumplimiento por Principio', index=False)
      ws_princ = writer.sheets['Cumplimiento por Principio']
      for col_num, col_name in enumerate(df_principios.columns):
          ws_princ.write(0, col_num, col_name, fmt_header)
      ws_princ.set_column('A:A', 20)
      ws_princ.set_column('B:F', 12)

      # Hoja 5: Top 5 Detallado
      ws_top5 = workbook.add_worksheet('Top 5 Detallado')
      writer.sheets['Top 5 Detallado'] = ws_top5

      r = 0
      for idx, banco in enumerate(top5_bancos):
          df_banco = df[df["bank_name"] == banco]
          ws_top5.write(r, 0, f"#{idx+1} - {banco}", fmt_titulo); r += 2
          ws_top5.write(r, 0, "Principio", fmt_header)
          for j, n in enumerate(["Nivel A", "Nivel AA", "Nivel AAA"]):
              ws_top5.write(r, j+1, n, fmt_header)
          r += 1

          for principio in ["Perceptible", "Operable", "Comprensible", "Robusto"]:
              ws_top5.write(r, 0, principio)
              for j, nivel in enumerate(["A", "AA", "AAA"]):
                  df_sub = df_banco[(df_banco["principle"] == principio) & (df_banco["level"] == nivel)]
                  cumple      = (df_sub["verdict"] == "pass").sum()
                  total_nivel = len(df_sub)
                  ws_top5.write(r, j+1, f"{cumple}/{total_nivel}")
              r += 1
          r += 2

      ws_top5.set_column('A:A', 20)
      ws_top5.set_column('B:D', 15)

      # Hoja 6: Matriz Entidad-Nivel
      df_matriz[["Banco", "% Nivel A", "% Nivel AA", "% Nivel AAA", "Promedio general"]].to_excel(
          writer, sheet_name='Matriz Entidad-Nivel', index=False
      )
      ws_matriz = writer.sheets['Matriz Entidad-Nivel']
      for col_num, col_name in enumerate(["Banco", "% Nivel A", "% Nivel AA", "% Nivel AAA", "Promedio general"]):
          ws_matriz.write(0, col_num, col_name, fmt_header)
      ws_matriz.set_column('A:A', 40)
      ws_matriz.set_column('B:E', 15)

      # Hoja 7: Distribucion Estados
      df_distribucion.to_excel(writer, sheet_name='Distribucion Estados', index=False)
      ws_dist = writer.sheets['Distribucion Estados']
      for col_num, col_name in enumerate(df_distribucion.columns):
          ws_dist.write(0, col_num, col_name, fmt_header)
      ws_dist.set_column('A:H', 15)

      # Hoja 8: Brechas por Nivel
      if brechas_nivel:
          df_brechas.to_excel(writer, sheet_name='Brechas por Nivel', index=False)
          ws_brech = writer.sheets['Brechas por Nivel']
          for col_num, col_name in enumerate(df_brechas.columns):
              ws_brech.write(0, col_num, col_name, fmt_header)
          ws_brech.set_column('A:A', 12)
          ws_brech.set_column('B:B', 35)
          ws_brech.set_column('C:C', 12)
          ws_brech.set_column('D:D', 35)
          ws_brech.set_column('E:G', 15)

      # Hoja 9: Datos Crudos
      df_raw = df[["bank_name", "code", "title", "verdict", "level", "principle"]].copy()
      df_raw.columns = ["Entidad", "Codigo", "Titulo", "Veredicto", "Nivel", "Principio"]
      df_raw.to_excel(writer, sheet_name='Datos Crudos', index=False)
      ws_raw = writer.sheets['Datos Crudos']
      for col_num, col_name in enumerate(df_raw.columns):
          ws_raw.write(0, col_num, col_name, fmt_header)
      ws_raw.set_column('A:A', 40)
      ws_raw.set_column('B:B', 15)
      ws_raw.set_column('C:C', 60)
      ws_raw.set_column('D:F', 15)

  print("\n Excel exportado exitosamente")
  print(f"Archivo: {EXCEL_OUTPUT}")
  print("\nContenido:")
  print("  Hoja 1: Resumen Ejecutivo")
  print("  Hoja 2: Ranking de Entidades")
  print("  Hoja 3: Criterios por Pauta")
  print("  Hoja 4: Cumplimiento por Principio")
  print("  Hoja 5: Top 5 Detallado")
  print("  Hoja 6: Matriz Entidad-Nivel")
  print("  Hoja 7: Distribucion Estados")
  print("  Hoja 8: Brechas por Nivel")
  print("  Hoja 9: Datos Crudos")
`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(colabCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      alert("No se pudo copiar el código. Intenta manualmente.");
    }
  };

  return (
    <div className="container audit-container">
      {/* Header estilo PanelPrincipal */}
      <div className="app-header">
        <h1 className="titulo">Código de Análisis – Google Colab</h1>

        <div className="user-info">
          {/* ✅ Nombre de usuario */}
          <span className="user-name">👤 {user?.username || "Usuario"}</span>

          <button
            type="button"
            className="chip chip-neutral"
            onClick={toggle}
            title="Cambiar tema"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button
            type="button"
            className="chip chip-neutral"
            onClick={() => navigate("/panelprincipal")}
            title="Volver al Panel"
          >
            ⬅ Volver
          </button>
        </div>
      </div>

      {/* Card principal */}
      <div className="card">
        <div
          className="card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <h2 className="subtitulo">Script listo para copiar</h2>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="chip chip-good"
              onClick={handleCopy}
              title="Copiar el código al portapapeles"
            >
              {copied ? "✅ Copiado" : "📋 Copiar"}
            </button>

            <button
              type="button"
              className="chip chip-neutral"
              onClick={() => navigate("/panelprincipal")}
              title="Regresar a la página principal"
            >
              🏠 Panel
            </button>
          </div>
        </div>

        <p className="hint">
          Copia el código y pégalo en Google Colab. Luego ejecútalo para analizar los datos exportados (CSV/Excel).
        </p>

        {/* Bloque de código */}
        <div className="overflow-x" style={{ marginTop: "0.75rem" }}>
          <pre
            style={{
              margin: 0,
              padding: "1rem",
              borderRadius: 10,
              background: "rgba(0,0,0,0.85)",
              color: "#fff",
              overflowX: "auto",
              maxHeight: 520,
              lineHeight: 1.45,
            }}
          >
            <code>{colabCode}</code>
          </pre>
        </div>

        {/* Barra inferior de acciones */}
        <div className="row wrap gap-sm" style={{ marginTop: "1rem" }}>
          <button type="button" className="audit-btn" onClick={handleCopy}>
            {copied ? "✅ Copiado" : "📋 Copiar código"}
          </button>

          <button
            type="button"
            className="audit-btn secondary"
            onClick={() => navigate("/panelprincipal")}
          >
            ⬅ Regresar al Panel
          </button>
        </div>
      </div>
    </div>
  );
}

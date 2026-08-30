---
title: "Data"
---

I build digital-trace data usable for political communication study and
aggregated survey data for comparable research. Each entry below says what you
can do with it: **download** the data as a file, or **open an interactive app**
to explore it in your browser before downloading.

<br>

### Digitally Accountable Public Representation (DAPR) Database

28,834 U.S. federal, state, and local elected officials; 5,769,904 tweets and
450,972 Facebook posts, January 2020 – December 2024, with officials'
demographic metadata and weekly aggregated platform activity.

<p>
  <a href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/A9EPYJ" target="_blank" rel="noopener noreferrer" class="badge badge-large"><i class="fa-solid fa-table"></i>&nbsp;Download from Harvard Dataverse</a>
  <a href="/publications/dapr/" class="badge badge-large"><i class="fa-solid fa-file-lines"></i>&nbsp;Read the paper</a>
</p>

<p style="font-size:90%;color:#52514e;">
Too large to explore in a browser — the Dataverse archive is the place to start.
</p>

<br>

### Trust in Government (TrustGov)

115 countries and territories, 1973–2020. Bayesian latent-variable estimates of public
trust in national government, harmonizing 1,545 country-year observations from 189
national and cross-national surveys. Updated through periodic releases.

<a href="/data/tgov/" title="Open the TrustGov interactive app">
  <img src="/images/tgov-explorer.png" style="width:100%;max-width:620px;border:1px solid #d7d5d0;border-radius:4px;display:block;" alt="Preview of the TrustGov interactive app: a line chart comparing trust in government for the United States, Germany, and Italy from 1973 to 2020, each line surrounded by a shaded uncertainty band.">
</a>

<p style="font-size:90%;color:#52514e;margin-top:0.4em;">
Preview of the interactive app — compare up to five countries or territories, adjust the year
range, and read the uncertainty around every estimate. <a href="/data/tgov/">Open it &rarr;</a>
</p>

<p>
  <a href="/data/tgov/" class="badge badge-large"><i class="fa-solid fa-chart-line"></i>&nbsp;Open interactive app</a>
  <a href="/data/tgov/TGOV_estimates.csv" download class="badge badge-large"><i class="fa-solid fa-table"></i>&nbsp;Download CSV</a>
  <a href="https://github.com/casstai/TGOV" target="_blank" rel="noopener noreferrer" class="badge badge-large"><i class="fa-brands fa-github"></i>&nbsp;Code</a>
  <a href="/publications/tgov/" class="badge badge-large"><i class="fa-solid fa-file-lines"></i>&nbsp;Read the paper</a>
</p>

<br>

### Trust in Civil Servants (TCS)

98 countries and territories, 1986–2022. Latent-variable estimates of public
trust in the bureaucracy, from 123 national and cross-national surveys. With
Frederick Solt.

<a href="/data/tcs/" title="Open the TCS interactive app">
  <img src="/images/tcs-explorer.png" style="width:100%;max-width:620px;border:1px solid #d7d5d0;border-radius:4px;display:block;" alt="Preview of the TCS interactive app: a line chart comparing trust in civil servants for the United States, Germany, and Poland from 1986 to 2022, each line surrounded by a shaded uncertainty band.">
</a>

<p style="font-size:90%;color:#52514e;margin-top:0.4em;">
Preview of the interactive app — compare up to five countries or territories,
adjust the year range, and read the uncertainty around every estimate. <a href="/data/tcs/">Open it &rarr;</a>
</p>

<p>
  <a href="/data/tcs/" class="badge badge-large"><i class="fa-solid fa-chart-line"></i>&nbsp;Open interactive app</a>
  <a href="/data/tcs/TCS_estimates.csv" download class="badge badge-large"><i class="fa-solid fa-table"></i>&nbsp;Download CSV</a>
  <a href="https://github.com/fsolt/dcpo_trust_bureaucracy" target="_blank" rel="noopener noreferrer" class="badge badge-large"><i class="fa-brands fa-github"></i>&nbsp;Code</a>
  <a href="/publications/trust-in-civil-servants/" class="badge badge-large"><i class="fa-solid fa-file-lines"></i>&nbsp;Read the paper</a>
</p>

<br>

## Contributed datasets

Datasets I co-authored as part of the
<a href="https://dcpo.org/" target="_blank" rel="noopener noreferrer">Dynamic Comparative Public Opinion</a> project:

* **Support for Gay Rights (SGR)** — 118 countries, up to 51 years.
  <a href="https://github.com/fsolt/dcpo_gayrights" target="_blank" rel="noopener noreferrer">Code</a> &middot;
  <a href="/publications/gay-rights/">Paper</a>

<div style = "line-height: 50%;">
    <br>
</div>

* **Public Political Discontent (PPD)** — over 100 countries, four decades.
  <a href="https://github.com/fsolt/dcpo_discontent" target="_blank" rel="noopener noreferrer">Code</a> &middot;
  <a href="/publications/macrodiscontent/">Paper</a>

<br>

## A note on using latent-variable estimates

The TGOV, TCS, SGR, and PPD datasets are all model estimates, not direct survey
percentages. Each country-year comes with measurement
uncertainty, and analyses should propagate it rather than treating the posterior
means as known quantities — a point my
<a href="/publications/democracy-measurement/">2022 <em>APSR</em> paper</a> makes
at length. The full posterior draws are in each project's replication repository.

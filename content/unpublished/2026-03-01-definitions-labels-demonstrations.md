---
author: Mishra, Viraj, Shubham Gupta, Dhruv Gupta, Yuehong Cassandra Tai and Qunhua Li (<em>with undergraduate students</em>)
comments: false
date: '2026-03-01'
slug: definitions-labels-demonstrations
title: 'Definitions, Label Names, or Demonstrations? Auditing What Governs LLM Annotation'
kind: under review
ordinal: 5
tags:
- LLMs
- annotation
- measurement
- validity
---

Large language models (LLMs) are increasingly used to annotate social-science texts, but high accuracy does not establish that they apply researcher-supplied category definitions: predictions may instead reflect prior associations with category labels or labeled demonstrations. We introduce a counterfactual audit that reassigns definitions among output labels, distinguishing adherence to supplied definitions from preservation of a dataset's original mapping. Across three political-text datasets, models rarely follow reassigned definitions, and standard fine-tuning strengthens the original mapping without reliably increasing definition adherence. We then study retrieval-augmented annotation. Retrieving the nearest training examples generally outperforms retrieving examples separately within each category despite using fewer demonstrations. On the two tasks with substantial gains, direct *k*-nearest-neighbor classification recovers 74–93% of the improvement, indicating that neighborhood labels provide much of the predictive signal. Relabeling fixed demonstrations redirects predictions, whereas aligning demonstrations with reassigned definitions substantially increases adherence to the new mapping. Thus, accuracy-improving interventions need not increase codebook adherence; definitions, category labels, demonstrations, retrieval, and training data should be aligned and validated jointly.

# Local Qwen cold-start timeout and uneven generated wording

Expected: A bounded medium-model draft should complete reliably and stay within supplied facts.

Observed: Two runs hit the 30-second provider header limit. With a 120-second header allowance, one run completed in112.63s and resisted injected Stanford/doctor claims, but overstated the supplied skill as expert. The stricter no-expertise-inflation follow-up timed out at180s. Prompt and bounded timing were improved; reliable live-model quality is not established.

Evidence:

- model-evaluation.json

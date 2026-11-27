import json,tempfile,unittest,hashlib
from pathlib import Path
import numpy as np
import soundfile as sf
from reconstruct_recorded import safe_event,render_stem,validate_map,compare_source_and_candidate,EXPECTED_INSTRUMENT_STEMS

class ReconstructionGates(unittest.TestCase):
 def test_no_unverified_source_and_no_unlicensed_source(self):
  with tempfile.TemporaryDirectory() as tmp:
   bank=Path(tmp);p=bank/'sample.wav';sf.write(p,np.zeros(48000),48000)
   digest=hashlib.sha256(p.read_bytes()).hexdigest()
   good={'file':'sample.wav','sha256':digest,'license':'CC0-1.0','source_url':'https://example.org/licensed','source_kind':'recorded-instrument','at_sec':0,'duration_sec':0.5}
   self.assertEqual(safe_event(good,bank,set())['sha256'],digest)
   for invalid in [dict(good,license='unknown'),dict(good,sha256='f'*64),dict(good,source_kind='unknown'),dict(good,file='../other.wav')]:
    with self.assertRaises(ValueError):safe_event(invalid,bank,set())
   with self.assertRaises(ValueError):safe_event(good,bank,{digest})
 def test_no_10_stem_coverage_means_no_render(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'events.json'
   p.write_text(json.dumps({'source_zip_sha256':'x','stems':[]}))
   with self.assertRaises(ValueError):validate_map(p,Path(tmp),{'source_archive_sha256':'x','stems':[]})
 def test_valid_short_independent_recording_writes_audio_and_hash(self):
  with tempfile.TemporaryDirectory() as tmp:
   bank=Path(tmp);p=bank/'sample.wav'
   audio=np.sin(2*np.pi*440*np.arange(48000)/48000).astype('float32')*.1
   sf.write(p,audio,48000,subtype='PCM_24')
   ev={'file':'sample.wav','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),
   'license':'CC0-1.0','source_url':'https://example.org/licensed','source_kind':'recorded-instrument',
   'at_sec':0.1,'duration_sec':0.3,'gain':1,'pan':0}
   safe=safe_event(ev,bank,set());r=render_stem([safe],bank/'rebuild.wav',duration_sec=1.)
   self.assertEqual(r['frames'],48000)
   self.assertTrue((bank/'rebuild.wav').exists())
   self.assertEqual(sf.info(bank/'rebuild.wav').subtype,'PCM_24')

if __name__=='__main__':unittest.main()
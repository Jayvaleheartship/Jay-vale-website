import csv,hashlib,json,tempfile,unittest
from pathlib import Path
import numpy as np
import soundfile as sf
from interlude_workflow import approved_sample_catalogue,recording_profile,profile_distance,init_project

class WorkflowSafetyTests(unittest.TestCase):
 def test_audio_profile_scoring_is_ranking_not_95_acceptance(self):
  x=np.column_stack([np.sin(2*np.pi*440*np.arange(16000)/16000)]*2).astype('float32')
  a=recording_profile(x)
  r=profile_distance(a,a)
  self.assertAlmostEqual(r['ranking_score'],1,places=4)
  self.assertTrue(r['not_95_percent_quality_test'])
 def test_rejects_unlicensed_unverified_and_missing_files(self):
  with tempfile.TemporaryDirectory() as temp:
   p=Path(temp)
   audio=p/'test.wav'
   sf.write(audio,np.zeros(16000,dtype='float32'),16000)
   digest=hashlib.sha256(audio.read_bytes()).hexdigest()
   cats=[{'name':'valid','file':'test.wav','sha256':digest,'license':'CC0-1.0',
          'source_url':'https://example.org/valid-cc0','family':'drums'},
         {'name':'unlicensed','file':'test.wav','sha256':digest,'license':'proprietary',
          'source_url':'https://example.org/unknown','family':'drums'},
         {'name':'corrupt-hash','file':'test.wav','sha256':'0'*64,'license':'CC0-1.0',
          'source_url':'https://example.org/valid-cc0','family':'drums'},
         {'name':'path-escape','file':'../private.wav','sha256':digest,'license':'CC0-1.0',
          'source_url':'https://example.org/valid-cc0','family':'drums'}]
   (p/'catalogue.json').write_text(json.dumps(cats))
   good,bad=approved_sample_catalogue(p/'catalogue.json')
   self.assertEqual(len(good),1)
   self.assertEqual(len(bad),3)
 def test_interlude_project_keeps_final_master_blocked(self):
  manifest=json.loads(Path('/mnt/data/interlude_pipeline/interlude/original_analysis/INTERLUDE_SOURCE_MANIFEST.json').read_text())
  manifest['workspace']='/mnt/data/interlude_pipeline/interlude/original_analysis'
  with tempfile.TemporaryDirectory() as tmp:
   state=init_project(manifest,Path(tmp)/'project')
   self.assertEqual(state['source_stems_available'],12)
   self.assertEqual(state['steps'][0]['status'],'COMPLETE')
   self.assertTrue(all(x['status']=='BLOCKED' for x in state['steps'][1:]))
   self.assertIsNone(state['outputs']['final_master_wav'])
   self.assertIsNone(state['outputs']['final_verified_download'])
   self.assertEqual(len(json.loads((Path(tmp)/'project/sample_acquisition_queue.json').read_text())),10)
 def test_spectra_outputs_are_from_all_12_real_stems(self):
  path=Path('/mnt/data/interlude_pipeline/interlude/original_analysis')
  manifest=json.loads((path/'INTERLUDE_SOURCE_MANIFEST.json').read_text())
  self.assertEqual(len(manifest['stems']),12)
  self.assertTrue(manifest['source_format_synchronized'])
  self.assertEqual(manifest['duration_range_sec'],[193.104,193.104])
  for stem in manifest['stems']:
   prefix=f"{stem['stem_id']:02d}"
   self.assertTrue((path/'analysis'/f'{prefix}_summary.json').exists())
   self.assertTrue((path/'analysis'/f'{prefix}_microframes_250ms.csv').exists())
   self.assertTrue((path/'analysis'/f'{prefix}_onsets.csv').exists())
   with (path/'analysis'/f'{prefix}_microframes_250ms.csv').open() as f:
    self.assertGreater(sum(1 for _ in csv.reader(f)),500)

if __name__=='__main__':unittest.main()
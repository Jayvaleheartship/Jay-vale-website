import json, tempfile, unittest
from pathlib import Path
import numpy as np
from human_vocal_research import frame_features,summary,write_analysis,run

class VocalResearchTest(unittest.TestCase):
    def test_stereo_signal_audio_features(self):
        sr=16000
        t=np.arange(sr)/sr
        s=.1*np.sin(2*np.pi*190*t)
        x=np.column_stack([s,s]).astype('float32')
        rows=frame_features(x)
        self.assertGreater(len(rows),35)
        self.assertAlmostEqual(summary(rows)['metrics']['lr_correlation']['median'],1,places=3)
        self.assertAlmostEqual(summary(rows)['metrics']['f0_candidate_hz']['median'],190,delta=12)
        self.assertGreater(summary(rows)['metrics']['periodicity']['median'],.45)
    def test_silent_audio_not_misrepresented(self):
        with self.assertRaises(ValueError):
            write_analysis(tempfile.mkdtemp(),'silence',np.zeros((16000,2)), 'candidate','unverified')
    def test_reject_non_finite(self):
        with self.assertRaises(ValueError):
            frame_features(np.ones((1000,2))*np.nan)
    def test_outputs_only_analysis_no_audio(self):
        with tempfile.TemporaryDirectory() as td:
            t=np.arange(16000)/16000
            a=.1*np.sin(2*np.pi*225*t)
            report=write_analysis(td,'male_control',np.column_stack([a,a]),'candidate',{'verified':False})
            self.assertEqual(report['origin_classifier'],'NOT RUN')
            self.assertFalse(report['audio_output_modified'])
            self.assertCountEqual([p.suffix for p in Path(td).iterdir()],['.json','.csv'])
            self.assertEqual(json.loads((Path(td)/'male_control_summary.json').read_text())['provenance']['verified'],False)

if __name__=='__main__':unittest.main()
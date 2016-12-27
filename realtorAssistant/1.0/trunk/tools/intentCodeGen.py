import os
import json
import glob
from pprint import pprint

inDir="in"
inFile="intentData.json"
filelist=glob.glob(os.path.join(inDir, inFile))
for filename in filelist:
	with open (filename) as df:
		data = json.load(df)
		for intent in data["intents"]:
			pprint(intent)
import {compare} from './experiments.mjs?v=043';
self.onmessage=e=>{try{self.postMessage({result:compare(e.data.base,e.data.plan)})}catch(error){self.postMessage({error:error.message})}};

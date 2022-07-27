import { EdgeKV } from "./edgekv.js";
import URLSearchParams from 'url-search-params'; 

/* If query string parameter "ew-error-${eventHandler}" is present in the request, then throw a JavaScript error.   
Used for simulated errors to test failover logic   Error types:     ExecutionError     CpuTimeoutError     WallTimeoutError*/
async function checkSimulatedErrors (eventHandler, request) {
    const params = new URLSearchParams(request.query);
    const errorType = params.get(`ew-error-${eventHandler}`);
    if (errorType) {
        switch (errorType) {
            case 'ExecutionError':
                // Throw JS error
                throw new Error(`Simulated error: ${errorType} in ${eventHandler}`);
            case 'CpuTimeoutError':
                // Create infinite loop, resluting in exceeding CPU timeout
                while(true){}
            case 'WallTimeoutError':
                // Promise never calls resolve or reject method.
                // Since Promise never resolves, the await will never complete.
                //  awaiting the result of checkSimulatedErrors will result in a wall timeout
                var unresolvingPromise = new Promise(()=>{});
                await unresolvingPromise;
        }
    }
}

export async function onClientRequest (request) {
  await checkSimulatedErrors('onClientRequest', request);
  const edgeKv = new EdgeKV({ namespace: "redirects", group: "Staging" });
  const redir = await edgeKv.getJson({ item: request.getVariable('PMUSER_PATH_HASH') });
  //let query_string = request.getVariable('PMUSER_QUERY_STRING');
  let query_string = request.query;
  
  if (redir) {
    //request.setVariable("PMUSER_DO_ERC", 0);
    let destination = redir.location;
    if (query_string) {
      destination = redir.location + "?" + query_string;
    }
    if (!destination.includes("http")) {
      destination = request.scheme + "://" + request.host + destination;
    } 
    request.respondWith(301, {
      Location: [destination]
    }, '');
  }
}  

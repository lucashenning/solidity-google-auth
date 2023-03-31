import { CircularProgress } from "@mui/material";
import { SendTransactionResult } from "@wagmi/core";
import { useEffect, useState } from "react";

interface TransactionProgressProps {
    tx: SendTransactionResult;
}

function TransactionProgress({tx}: TransactionProgressProps) {
    const [txMined, setTxMined] = useState(false);
    
    useEffect(() => {
        if (tx) {
            tx.wait().then(() => {
                setTxMined(true);
            });
        }
    }, [tx]);
    
    return (
        <div>
            {tx && <div>
                <p><a href={`https://goerli.etherscan.io/tx/${tx.hash}`}>View on Etherscan {tx.hash}</a></p>
            </div>}
            { !txMined && 
                <div>
                    <CircularProgress />
                <p>Waiting for transaction to be mined...</p>
                </div> 
            }
            { txMined && <p>Transaction mined! {tx.hash}</p> }
        </div>
    )
}

export default TransactionProgress;
import * as anchor from '@project-serum/anchor'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AIRBNB_PROGRAM_PUBKEY } from '../constants'
import airbnbIDL from '../constants/airbnb.json'
import { SystemProgram } from '@solana/web3.js'
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { authorFilter } from '../utils'
import { PublicKey } from '@solana/web3.js'
import { set } from 'date-fns'
import { tr } from 'date-fns/locale'


// Static data that reflects the todo struct of the solana program


export function useAirbnbfn() {
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const anchorWallet = useAnchorWallet()

    const [initialized, setInitialized] = useState(false)
    const [transactionPending, setTransactionPending] = useState(false)

    // const program = new PublicKey(
    //     "8ktkADKMec8BE1q47k6LnMWqYpNTjqtinZ6ng219wMwf"
    //   );
    
    const program = useMemo(() => {
        if (anchorWallet) {
            const provider = new anchor.AnchorProvider(connection, anchorWallet, anchor.AnchorProvider.defaultOptions())
            return new anchor.Program(airbnbIDL, AIRBNB_PROGRAM_PUBKEY, provider)
        }
    }, [connection, anchorWallet])


      useEffect(()=> {

        const start = async () => {
            if (program && publicKey && !transactionPending) {
                try {
                    const [profilePda, profileBump] = await findProgramAddressSync([utf8.encode('USER_STATE'), publicKey.toBuffer()], program.programId)
                    const profileAccount = await program.account.userProfile.fetch(profilePda)
                    
                    if (profileAccount) {
                        setInitialized(true)
                    } else {
                        setInitialized(false)
                    }
                } catch (error) {
                    console.log(error)
                    
                }
            }
        
        }
        start()

    },[publicKey,program, transactionPending])

    const initializeUser = async () => {
        if (program && publicKey) {
            try {
                setTransactionPending(true)
                const [profilePda] = findProgramAddressSync([utf8.encode('USER_STATE'), publicKey.toBuffer()], program.programId)

                const tx = await program.methods
                    .intializeUser()
                    .accounts({
                        userProfile: profilePda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc()
                setInitialized(true)
                toast.success('Successfully initialized user.')
            } catch (error) {
                console.log(error)
            } finally{
                setTransactionPending(false)
            }
        }
    }

    return {initialized, initializeUser}
}

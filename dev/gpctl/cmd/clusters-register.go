// Copyright (c) 2021 Gitpod GmbH. All rights reserved.
// Licensed under the GNU Affero General Public License (AGPL).
// See License-AGPL.txt in the project root for license information.

package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"os"

	"github.com/spf13/cobra"

	"github.com/gitpod-io/gitpod/common-go/log"
	"github.com/gitpod-io/gitpod/ws-manager-bridge/api"
)

// clustersRegisterCmd represents the clustersListCmd command
var clustersRegisterCmd = &cobra.Command{
	Use:   "register",
	Short: "Register a cluster",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		conn, client, err := getClustersClient(ctx)
		if err != nil {
			log.WithError(err).Fatal("cannot connect")
		}
		defer conn.Close()

		file := args[0]

		request := &api.RegisterRequest{}
		if file == "-" {
			err := json.NewDecoder(os.Stdin).Decode(&request)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			content, err := ioutil.ReadFile(file)
			if err != nil {
				log.Fatal(err)
			}
			err = json.Unmarshal([]byte(content), &request)
			if err != nil {
				log.Fatal(err)
			}
		}

		_, err = client.Register(ctx, request)
		if err != nil && err != io.EOF {
			log.Fatal(err)
		}

		fmt.Printf("cluster registered: %v\n", request)
	},
}

func init() {
	clustersCmd.AddCommand(clustersRegisterCmd)
}

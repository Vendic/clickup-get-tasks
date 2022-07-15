# Clickup get tasks action [![Tests](https://github.com/Vendic/clickup-get-tasks/actions/workflows/tests.yml/badge.svg)](https://github.com/Vendic/clickup-get-tasks/actions/workflows/tests.yml)
Github action to get multiple tasks from Clickup via the REST API.


```yml
      - name: Get Clickup task info
        uses: Vendic/clickup-get-tasks@master
        with:
          clickup_token: ${{ secrets.CLICKUP_TOKEN }}
          clickup_custom_task_ids: ${{ env.TASKS }}
          clickup_team_id: ${{ env.TEAM_ID }}
          response_fields: |
            custom_id
            name
            url
```
